const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const cors = require("cors");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const { generateToken } = require('./jwtUtils');
const {v4 : uuidv4} = require('uuid');


const app = express();
const port = 3005;
const newId = uuidv4()
var id;

app.use(cors());
app.use(bodyParser.json());

const otps = {};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "sarathy0729@gmail.com",
    pass: "vkia frxg thau mggr",
  }
});


app.post("/send-otp", (req, res) => {
  const email = req.body.email;
   console.log("send-otp :",email);
  console.log("hh");
  

  let otp = "";
  for (let i = 0; i < 4; i++) {
    otp += Math.floor(Math.random() * 10);
  }
   console.log("send -otp :",otp);

  otps[email] = otp;
  // console.log(" otps[email] :", otps[email]);

  const mailOptions = {
    from: "sarathy0729@gmail.com",
    to: email,
    subject: "Your OTP Code",
    html: `<h3>Your OTP code is ${otp}</h3>`,
  };
 

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("mail error");
      return res.status("Error sending OTP");
    }
    res.send("OTP sent");
  });
});

app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  // console.log("verify-email:", email);
  // console.log("verify-otp:", otp);
  
  if (otps[email] === otp) {
    // console.log("OTP match:", otps[email] === otp);
    delete otps[email];
    res.send("OTP verified"); 
  } else {
    // console.log("OTP mismatch");
    err.send("Invalid OTP"); 
  }
});


const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "sarathy321",
  database: "ChatApp",
  charset: 'utf8mb4'
});

con.connect((err) => {
  if (err) throw err;
  console.log("Connected!");
  con.query(
    "CREATE TABLE IF NOT EXISTS user (name VARCHAR(20), gmail VARCHAR(30), password VARCHAR(100))",
    (err, result) => {
      if (err) throw err;
      console.log("Table created or already exists");
    }
  );
});

app.post("/signup", (req, res) => {
  const { name, email, password ,image} = req.body;
  // console.log(" signup name :",name);
  // console.log(" signup email :",email);
  // console.log(" signup password :",password);
  // console.log(" signup image :",image);
  // console.log("signup id",newId);
  console.log("jwendeje");
  
 
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      return res.send("Error encrypting password");
    }

    const sql = "INSERT INTO user (id ,name, gmail, password , images) VALUES (?, ?,?,?,?)";
    // console.log("sql :",sql,hash);
    con.query(sql, [uuidv4(),name, email, hash,image], (err, result) => {
      // console.log("sql query:",err,result);
      
      if (err) {
        return res.send("Error signing up");
      }
       res.send("Signup successful");
    });
  });
});

app.post("/login", (req, res) => {6777
const { email, password } = req.body;
// console.log("login email:", email);
// console.log("login password:", password);

const sql = "SELECT * FROM user WHERE gmail = ?";
con.query(sql, [email], (err, result) => {
  //  console.log("select * from:", result);
  if (err) {
    console.error("Database error:", err);
    return res.send("Internal server error");
  }
  if (result.length === 0) {
    // console.log("hjihhhih");
    return res.send("User not found");
  }
 const user = result[0];
//  console.log("user11",user);

  bcrypt.compare(password, user.password, (err, match) => {
    if (err) {
      console.log("error");
      console.error("Password comparison error:", err);
      return res.send("Internal server error");
    }

    if (match) {
      console.log("match", match);
      const token = generateToken({ email: user.gmail, name: user.Name, password: user.password,images:user.images, id: user.id });
      const id = user.id;
      const name = user.Name;
      const images=user.images
   return res.json({ message: "Login successful", token, email, password, name, id, images });
    } else {
      return res.send("Invalid password");
    }
  });
});
});


app.post("/change-password", (req, res) => {
  const { newPassword, email } = req.body;
  bcrypt.hash(newPassword, 10, (err, hash) => {
    if (err) {
      return res.send("Error encrypting password");
    }
    const sql = "UPDATE user SET password = ? WHERE gmail = ?";
    con.query(sql, [hash, email], (err, result) => {
      
      if (err) {
        return res.send("Error updating password");
      }
      res.send("Password updated successfully");
    });
  });
});

app.post('/send-message', (req, res) => {

  const { text, sender_id, receiver_id } = req.body;
  const sql = "INSERT INTO Messages ( id,sender_id,receiver_id,message_text) VALUES (?,?,?,?)"; 
  con.query(sql, [uuidv4(),sender_id,receiver_id,text], (err, result) => {
   
    if (err) {
      console.error("Database error:", err);
      return res.json({ error: "Internal server error" });
    }
    res.json({ success: true, message: 'Message sent successfully' });
  });
});

app.get("/user-profile", (req, res) => {
  const sql = "SELECT * FROM user" ;
  
con.query(sql,  (err, result) => {
   
      if (err) {
          console.error("Database error:", err);
          return res.json({ error: "Internal server error" });
      }
      return res.json(result); 
  });
});


app.get('/messages', (req, res) => {
  // console.log("run");
  const { sender_id, receiver_id } = req.query;
  
//    const sql= `UPDATE Messages
// SET is_read = '1'
// WHERE (sender_id = ? and  receiver_id = ? );
// `
// con.query (sql,[sender_id,receiver_id],(err,result)=>{
//   if(err){
//     console.log("err")
//   }
  const query = `
    select Messages.id , Messages.sender_id,Messages.receiver_id,Messages.message_text,Messages.sent_at,Messages.is_read,user.name from
 Messages join user on user.id = Messages.sender_id
    WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)`;

  con.query(query, [sender_id, receiver_id, receiver_id, sender_id], (err, results) => {
    if (err) return res.json({ error: err.message });
    res.json(results);
    
  });
// })
  
});

app.delete('/clear-messages', (req, res) => {
  const { sender_id, receiver_id } = req.body;
  console.log("sender_id",sender_id);
  console.log("receiver_id",receiver_id);
const query = 
    "DELETE FROM Messages  WHERE (sender_id = ? AND receiver_id = ?) ";

  con.query(query, [sender_id, receiver_id], (err, result) => {
    const sql = "DELETE FROM Messages  WHERE (sender_id = ? AND receiver_id = ?)";
    con.query(sql,[receiver_id,sender_id],(err,result)=>{})
    if (err) {
      console.error('Error clearing messages:', err);
      return res.json({ success: false, error: 'Internal Server Error' });
    }


    res.json({ success: true, message: 'Messages cleared successfully' });
  });
});

// app.post('/create-group', (req, res) => {
//   const { groupName, groupMembers, createdBy } = req.body; 
// const query = 'INSERT INTO createGroup (id,group_name, create_by) VALUES (?,?,?)';
//   con.query(query, [uuidv4(),groupName, createdBy], (err, result) => {
//      const qry = 'select id from createGroup where group_name = ? ';
//      con.query(qry,[groupName],(err,results)=>{
//           if (err) {
//       console.error('Error creating group:', err);
//       res.json({ success: false, error: err.message });
      
//     } else {   
//            let string=results;
//       console.log('group.id: ', string[0].id);
//       id = string[0].id;
//         console.log("value",id);
//              for (let i = 0; i < groupMembers.length; i++) {
//   user_id = groupMembers[i];
// const sql = 'INSERT INTO group_members (id,group_id, user_id, group_name) VALUES (?, ?, ?,?)';
//   console.log("uuidv4",uuidv4);
//   console.log("value",id);
//   console.log("user_id",user_id);
//   console.log("groupName",groupName);
//   con.query(sql, [uuidv4(),id, user_id, groupName], (err, result) => {
//     if (err) {
//       console.error('Error creating group member:', err);
//       errors.push(err.message); 
//     }
//     // console.log("Resultresult",result);
//     return res.json(result );
//   });
// }
// }
//      })

//     if (err) {
//       console.error('Error creating group:', err);
//       res.json({ success: false, error: err.message });
      
//     } else {


//   res.json({ success: true });
// } 
//  });
// });
app.post('/create-group', (req, res) => {
  const { groupName, groupMembers, createdBy,image } = req.body;
const admin = true;
  const query = 'INSERT INTO createGroup (id, group_name, create_by,is_admin,images) VALUES (?, ?, ?,?,?)';
  con.query(query, [uuidv4(), groupName, createdBy,admin,image], (err) => {
    if (err) {
      console.error('Error creating group:', err);
      return res.json({ success: false, error: err.message });
    }

    const qry = 'SELECT id FROM createGroup WHERE group_name = ?';
    con.query(qry, [groupName], (err, results) => {
      if (err) {
        console.error('Error fetching group ID:', err);
        return res.json({ success: false, error: err.message });
      }

      const groupId = results[0].id;
      let completed = 0;
      let errors = [];

      if (groupMembers.length === 0) {
        return res.json({ success: true, message: "Group created with no members" });
      }

      groupMembers.forEach((userId) => {
        const sql = 'INSERT INTO group_members (id, group_id, user_id, group_name) VALUES (?, ?, ?, ?)';
        con.query(sql, [uuidv4(), groupId, userId, groupName], (err) => {
          completed++;
          if (err) {
            console.error('Error inserting group member:', err);
            errors.push(err.message);
          }

         
          if (completed === groupMembers.length) {
            if (errors.length > 0) {
              res.json({ success: false, errors });
            } else {
              res.json({ success: true, groupId });
            }
          }
        });
      });
    });
  });
});


app.get('/group-info', (req, res) => {
  // console.log("groupinfo",req.query.user_id)
  const user_id =req.query.user_id;
  // console.log("user_id",user_id);
  const sql = 'SELECT createGroup.id,createGroup.group_name,createGroup.create_by,createGroup.images,createGroup.is_admin FROM createGroup JOIN group_members ON createGroup.id = group_members.group_id WHERE group_members.user_id = ?';
   con.query(sql,[user_id] , (err, result) => {
        if (err) {
          console.error('Error fetching group:', err);
          res.json({ success: false, error: err.message });
        } 
        return res.json(result); 
      });
    });

   
   app.post('/block-user', (req, res) => {
  const { blocker_id, blocked_id } = req.body;
 const blockUser = `INSERT INTO blocked_users (blocker_id, blocked_id) VALUES (?, ?) `;

  con.query(blockUser, [blocker_id, blocked_id], (error, results) => {
    if (error) {
      console.error('Error blocking user:', error);
      return res.json({ success: false, error: 'Database error' });
    }

    res.json({ success: true });
  });
});

app.post('/unblock-user', (req, res) => {
  const { blocker_id, blocked_id } = req.body;
  // console.log("block_id",blocker_id);
  // console.log("blocked",blocked_id);
 const unblockUser = ` DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?`;
 con.query(unblockUser, [blocker_id, blocked_id], (error, results) => {
    if (error) {
      console.error('Error unblocking user:', error);
      return res.json({ success: false, error: 'Database error' });
    }

    if (results.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false, error: 'Block record not found' });
    }
  });
});

app.post('/send-group-message', (req, res) => {
  const { group_id, sender_id, message_text } = req.body;
 const query = 'INSERT INTO group_messages (id ,group_id, sender_id, message_text) VALUES (?, ?, ?,?)';
  con.query(query, [uuidv4(),group_id, sender_id, message_text], (err, result) => {
      if (err) {
          console.error('Error saving group message:', err);
          res.json({ success: false});
      } else {
          res.json({ success: true});
      }
  });
});
app.get('/group-messages', (req, res) => {
  // console.log("group message",req);
  const  group_id = req.query.group_id; 
  // console.log("id",group_id);
  const query = ` select group_messages.id , group_messages.group_id,group_messages.sender_id, group_messages.message_text,
 group_messages.sent_at,user.name from group_messages join user on user.id = group_messages.sender_id WHERE group_id = ? `;
  con.query(query, [group_id], (err, results) => {
    // console.log("res",results)
    if (err) {  
      res.json({ success: false, error: 'Failed to fetch group messages' });
    } else {
      // console.log("results",results);
       res.json(  results );
    }
  });
});

app.get('/group-members',(req,res)=>{
  const groupid = req.query.group_id;
  const query = ` select  group_members.group_name ,group_members.user_id , user.Name ,user.images, group_members.joined_at from group_members join user on group_members.user_id = user.id 
 where group_members.group_id = ?`;
 con.query(query,[groupid],(err,result)=>{
   if (err) {  
      res.json({ success: false, error: 'Failed to fetch group messages' });
    } else {
     
           res.json( result );
    }
 })
})
app.post("/remove_member", (req, res) => {
  const { group_id, group } = req.body;
  console.log("group_id",group_id);
  console.log("user_id",group);

  const query = "DELETE FROM group_members WHERE (group_id = ? AND user_id = ?)";
   con.query(query,[group_id,group],(err,result)=>{
    if (err) {
      console.log("Error removing group member:", err);
      return res.json({ error: "Failed to remove group member" });
    }

   console.log("result",result);
    return res.json({ success: "Member removed successfully", result });
   })
  
    
  
});
app.post("/addMembers", (req, res) => {
  console.log("addMembers in group", req.body);
  const { id, addgroupMembers, groupname } = req.body;

  if (addgroupMembers.length === 0) {
    return res.json({ success: false, message: "No members to add." });
  }

  let completed = 0;
  let errors = [];

  addgroupMembers.forEach((user_id) => {
    const sql = `INSERT INTO group_members(id, group_id, user_id, group_name) VALUES (?, ?, ?, ?)`;
    con.query(sql, [uuidv4(), id, user_id, groupname], (err, result) => {
      completed++;
      if (err) {
        console.error("Failed to add member:", err);
        errors.push({ user_id, error: err.message });
      }

      if (completed === addgroupMembers.length) {
        if (errors.length > 0) {
          return res.json({ success: false, errors });
        } else {
          return res.json({ success: true, message: "All members added successfully." });
        }
      }
    });
  });
});
   app.delete('/clear-singlemsg',(req,res)=>{
    const ID = req.query.userid;
    console.log("msg-id",ID);
    const sql = " DELETE FROM Messages WHERE id = ?";
    con.query(sql,[ID],(err,result)=>{
      if(err){
        console.log("error");
      }
      else{
        console.log("delete");
        return res.send({success:true});
      }
    })

    
   })
   app.delete('/clear-groupmessages',(req,res)=>{
    const groupid = req.body.group_ID;
    console.log("groupid",groupid);
    const query = "DELETE FROM group_messages WHERE group_id = ?";
    con.query(query,[groupid],(err,result)=>{
      if(err){
         console.error('Error clearing messages:', err);
      return res.json({ success: false, error: 'Internal Server Error' });
      }
       res.json({ success: true, message: 'Messages cleared successfully' });
    })
   })
   app.delete('/clear-singlegroupmsg',(req,res)=>{
    const id = req.query.groupid;
    console.log("groupid",id);
    const sql = "DELETE FROM group_messages WHERE id =?";
    con.query(sql,[id],(err,result)=>{
      if(err){
        console.log("error");
      }
       else{
        console.log("delete");
        return res.send({success:true});
      }
    })
   })
   app.patch("/update",(req,res)=>{
    const {name,image,id}=req.body;
    if(name && image){
    const sql = "UPDATE user set Name = ? , images = ? WHERE id = ?";
    con.query(sql,[name,image,id],(err,result) => {
      if(err){
        console.log("err");
      }
      console.log("both")
      res.send({ success: true,message: 'updated successfully' });

    })
  }
  else if(name){
     const sql = "UPDATE user set Name = ? WHERE id = ?";
    con.query(sql,[name,id],(err,result) => {
      if(err){
        console.log("err");
      }
      console.log("name")
      res.send({ success: true,message: 'updated successfully' });

    })

  }
  else{
    const sql = "UPDATE user set images = ? WHERE id = ?";
    con.query(sql,[image,id],(err,result) => {
      if(err){

        console.log("err");
      }
      console.log("images")
      res.send({ success: true,message: 'updated successfully' });

    })
    

  }
   })
   app.patch("/updateGroup",(req,res)=>{
    const {id,group_image,group_name}=req.body;
    console.log("id",id);
    console.log("group_id",group_image);
    console.log("group_name",group_name);
    if(group_image && group_name){
      console.log("all");
    const sql = "UPDATE createGroup set group_name = ? , images = ? WHERE id = ?";
    con.query(sql,[group_name,group_image,id],(err,result)=>{
      if(err){
        console.log("err");
      }
      res.send({ success: true,message: 'updated successfully' });
    })
  }
  else if(group_name){
    console.log("name");
    const sql = "UPDATE createGroup set group_name = ?  WHERE id = ?";
    con.query(sql,[group_name,id],(err,result) => {
      if(err){
        console.log("err");
      }
      console.log("name")
      res.send({ success: true,message: 'updated successfully' });

    })
  }
  else{
      const sql = "UPDATE createGroup set images = ?  WHERE id = ?";
    con.query(sql,[group_image,id],(err,result) => {
      if(err){
        console.log("err");
      }
      console.log("images")
      res.send({ success: true,message: 'updated successfully' });

    })

  }
   })

  //  app.post("/wallpaper",(req,res)=>{
  // console.log("wallpaper");
  //  })
  
   
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
 });





