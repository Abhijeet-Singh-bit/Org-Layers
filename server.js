var express=require("express");
var app=express();
var mysql2=require("mysql2");
var cloudinary=require("cloudinary").v2;
var fileuploader=require("express-fileupload");
var nodemailer = require('nodemailer')
app.listen(1919,function(){
    console.log("Server Started");
})

//================== Cloudinary ===============================///

cloudinary.config({ 
    cloud_name: 'dbdnvbzh5', 
    api_key: '493172728835671', 
    api_secret: 'ZX4UXKJsMCl1mXRjydm9WH-TSDg' // Click 'View API Keys' above to copy your API secret
 });

//==============================================================//

//======== for css and javascript files =========//

app.use(express.static("public"));

//==============================================//

//===========Database conectivity==============//

let config="mysql://avnadmin:AVNS_e8Tq32c59UG29NLLmix@mysql-a7287ae-thefacebookjeetsingh-bf73.i.aivencloud.com:19731/defaultdb";  //webserver? database? userid? password
let mysqlconnect=mysql2.createConnection(config);
mysqlconnect.connect(function(err)
{
    if(err==null)
        console.log("Connected Database Server Successfully");
    else
    console.log(err.message);
})

//==========================================//

/////////// Sending page of html to localhost main page//////////////////

app.get("/",function(req,resp){
    let path=__dirname+"/public/index.html";
    resp.sendFile(path);
})

app.get("/here-signup",function(req,resp){
    let path1=__dirname+"/public/organization1.html";
    resp.sendFile(path1);
})

app.get("/publish-tournaments",function(req,resp){
    let path2=__dirname+"/public/publish-tournaments.html";
    resp.sendFile(path2);
})

// convert json in binary
app.use(express.urlencoded(true));
// /////////////////////////////

//======= Sending Data Through Post method =========//
app.post("/signup-process-secure",function(req,resp){

    mysqlconnect.query("insert into users values(?,?,?,current_date(),?)",[req.body.txtMail,req.body.txtpass,req.body.selectbox,1],function(err)
    {
    if(err==null)
    {
           resp.redirect("/");
    }
    else
            resp.send(err.message); 
    })
})

//======== check availibility of user =========//
app.get("/check-user",function(req,resp)
{
    //console.log(req.query.txtMail);
    let email=req.query.txtMail;
    mysqlconnect.query("select * from users where emailid=?",[email],function(err,jsonArray)
    {
        if(err!=null)
        {
            resp.send(err.message);
        }
        else
        if(jsonArray.length==1)
                resp.send("Already Taken");
            else
                resp.send(jsonArray);
    })
})

//=============== Login Modal ===============//

// app.post("/login-process-secure",function(req,resp)

// {
//     console.log(req.body);
//     resp.send("U R Logged in Successfully @ " +req.query.txtMail +" , " +"Password is "+req.query.txtpass);

// })


//======== check availibility of user during Login =========//
app.get("/check-user-login",function(req,resp)
{
    console.log(req.query.txtMaillogin);
    let email=req.query.txtMaillogin;
    let pwd=req.query.txtpasslogin;
    mysqlconnect.query("select * from users where emailid=? and pwd=?",[email,pwd],function(err,jsonArray)
    {
        //resp.send(jsonArray);
        if(jsonArray.length==1)
        {
            resp.send(jsonArray[0]["utype"]);
            // console.log(jsonArray[0]["status"]);

            // console.log("user Exist");
        }
        else
        {
            resp.send("incorrect user");
        }
    })
})

//=============== Organizer-profile-data ==============//
app.use(fileuploader());
let pbtour=__dirname+"/public/publish-tournaments.html";
app.post("/here-signup", async function(req,resp){
    let filename="";
    if(req.files==null)//pic did't uploaded
        {
            filename="nopic.jpg";
        }
        else
        {
            filename=req.files.profilepic.name;
            let path=__dirname+"/public/pics/"+filename;
            console.log(path);
            req.files.profilepic.mv(path);

        //     saving ur file/pic on cloudinary server
          await cloudinary.uploader.upload(path).then(function(result){
                 filename=result.url;   //will give u the url of ur pic on cloudinary server
                 console.log(filename);
            });
        }
    req.body.picpath=filename;
    mysqlconnect.query("insert into organizer values(?,?,?,?,?,?,?,?,?,?,?)",[req.body.txtmail,req.body.organization,req.body.contact,req.body.address,req.body.city,req.body.proof,req.body.profilepic,req.body.txtsports.toString(),req.body.picpath,req.body.website,req.body.insta],function(err)
    {
    if(err==null)
       // resp.send("Record Send Successfully To database");
    resp.redirect("/publish-tournaments");
    else
    {
        console.log(err.message);
    }
    })
});

///== fetch user in organization profile =====///////

app.get("/fetch-user",function(req,resp)
{
    let email=req.query.txtMail;
    mysqlconnect.query("select * from organizer where emailid=?",[email],function(err,jsonArray)
    {
        //possibility : 0 or 1 records
        
        if(err!=null)
        {
           resp.send(err.message);
        }
        else
                resp.send(jsonArray);   
    })
});

//========================================================================//

app.post("/update-organization",async function(req,resp)
{
let filename="";
if(req.files==null)//pic did't uploaded
    {
        filename="nopic.jpg";
    }
    else
    {
        filename=req.files.profilepic.name;
        let path=__dirname+"/public/pics/"+filename;
        console.log(path);
        req.files.profilepic.mv(path);

    //     saving ur file/pic on cloudinary server
      await cloudinary.uploader.upload(path).then(function(result){
             filename=result.url;   //will give u the url of ur pic on cloudinary server
             console.log(filename);
        });
    }
    req.body.picpath=filename;
    //save data acc to columns sequence
    mysqlconnect.query("update organizer set organization=?,contact=?,address=?,city=?,proof=?,ppic=?,sports=?,prev=?,website=? ,insta=? where emailid=?",[req.body.organization,req.body.contact,req.body.address,req.body.city,req.body.proof,req.body.profilepic,req.body.txtsports.toString(),req.body.picpath,req.body.website,req.body.insta,req.body.txtmail],function(err)
    {
        if(err==null)
               resp.send("Record Updated Successfully");
        else
                resp.send(err.message); 
    })
});
//=====================================================================//

//========= publish-tournaments Page ==============================//
app.post("/publish-tournaments",async function(req,resp){
    
    
    let filenames="";
    if(req.files==null)//pic did't uploaded
        {
            filenames="nopic.jpg";
        }
        else
        {
            filenames=req.files.Image.name;
            let path12=__dirname+"/public/pics/"+filenames;
            console.log(path12);
            req.files.Image.mv(path12);

        //     saving ur file/pic on cloudinary server
          await cloudinary.uploader.upload(path12).then(function(result){
                 filenames=result.url;   //will give u the url of ur pic on cloudinary server
                 console.log(filenames);
            });
        }
        req.body.picpath=filenames;

    mysqlconnect.query("insert into tournaments values(?,?,?,?,?,?,?,?,?,?,?,?)",[null,req.body.Email,req.body.Image,req.body.picpath,req.body.Game,req.body.Title,req.body.Entry,req.body.Date,req.body.City,req.body.Location,req.body.Prizes,req.body.info],function(err)
    {
    if(err==null)
           //resp.send("Record Send Successfully To database");
        resp.redirect("/");
    else
    {
        console.log(err.message);
    }    
    })
})

//===================================================================//

app.get("/fetch",function(req,resp){
    let path3=__dirname+"/public/tournaments-finder.html";
    resp.sendFile(path3);
})

//==================Fetch data to  fill Combobox ===================//

app.get("/fetch-game",function(req,resp)
{
    mysqlconnect.query("select distinct game from tournaments",function(err,jsonArray)
    {
        
        if(err!=null)
        {
            resp.send(err.message);
        }
        else
                resp.send(jsonArray);     
    })
});

app.get("/fetch-city",function(req,resp)
{
    
    mysqlconnect.query("select distinct city from tournaments",function(err,jsonArray)
    {
        
        if(err!=null)
        {
            resp.send(err.message);
        }
        else
                resp.send(jsonArray);       
    })
});

//=====================================================//
//==================Fetch All User ===================//

// app.get("/fetch-all-user",function(req,resp)
// {
//     mysqlconnect.query("select * from tournaments",function(err,jsonArray)
//     {
//         if(err!=null)
//         {
//             resp.send(err.message);
//         }
//         else
//             resp.send(jsonArray);   
//     })
// })

//==================================================//
//==================Search Particular Record  =================================================//
app.get("/search-tournaments",function(req,resp)
{
    mysqlconnect.query("select * from tournaments where game=? and city=?",[req.query.game,req.query.city],function(err,jsonArray)
    {
        if(err!=null)
        {
            resp.send(err.message);
        }
        else
            resp.send(jsonArray);   
    })
});

//========================================================================================================//
app.get("/fetch-details",function(req,resp)
{
    mysqlconnect.query("select * from tournaments",function(err,jsonArray)
    {
        if(err!=null)
        {
            resp.send(err.message);
        }
        else
            resp.send(jsonArray);   
    })
});

//----------------------------------------------------//
app.get("/password-update",function(req,resp){
    let path=__dirname+"/public/DashboardOg.html";
    resp.sendFile(path);
})

app.get("/password-updated",function(req,resp){
    
    mysqlconnect.query("update users set pwd=? where emailid=? and pwd=?",[req.query.Npassword,req.query.Email,req.query.Password],function(err,result){
    //  console.log(result.affectedRows);
    {  
          if(err!==null)
          {
              resp.send(err.message);
          }

          else if(result.affectedRows==1)
          {
              resp.send("Password Updated Successfully...");
          }

          else
          {
            console.log("Current Password Is Wrong");
          }
    }
})
});

//------------------------------------------------------------------------------------------/-/

//=========================== Player details ================================================///

app.get("/Player-details",function(req,resp){
    let path=__dirname+"/public/player-details.html";
    resp.sendFile(path);
})
app.post("/Player-details",async function(req,resp){
      
    let proofname="";
    if(req.files==null)//pic did't uploaded
        {
            proofname="no proof";
        }
        else
        {
            proofname=req.files.proof.name;
            let path12=__dirname+"/public/pics/"+proofname;
            console.log(path12);
            req.files.proof.mv(path12);

        //     saving ur file/pic on cloudinary server
          await cloudinary.uploader.upload(path12).then(function(result){
                 proofname=result.url;   //will give u the url of ur pic on cloudinary server
                 console.log(proofname);
            });
        }
        req.body.proofpath=proofname;

    mysqlconnect.query("insert into players values(?,?,?,?,?,?,?,?,?,?,?)",[req.body.mail,req.body.name,req.body.games,req.body.mobile,req.body.dob,req.body.gender,req.body.address,req.body.city,req.body.proofname,req.body.proofpath,req.body.info],function(err)
    {
    if(err==null)
           //resp.send("Record Send Successfully To database");
        resp.redirect("/fetch");
    else
    {
        console.log(err.message);
    }    
    })
});

app.post("/player-update",async function(req,resp)
{let proofname="";
    if(req.files==null)//pic did't uploaded
        {
            proofname="no proof";
        }
        else
        {
            proofname=req.files.proof.name;
            let path12=__dirname+"/public/pics/"+proofname;
            console.log(path12);
            req.files.proof.mv(path12);

        //     saving ur file/pic on cloudinary server
          await cloudinary.uploader.upload(path12).then(function(result){
                 proofname=result.url;   //will give u the url of ur pic on cloudinary server
                 console.log(proofname);
            });
        }
        req.body.proofpath=proofname;
    //save data acc to columns sequence
    mysqlconnect.query("update players set name=?,game=?,mobile=?,dob=?,gender=?,address=?,city=?,ppic=?,info=? where emailid=?",[req.body.name,req.body.games,req.body.mobile,req.body.dob,req.body.gender,req.body.address,req.body.city,req.body.proofpath,req.body.info,req.body.mail],function(err)
    {
        if(err==null)
               resp.send("Record Updated Successfully");
        else
                resp.send(err.message); 

    })

    // resp.send(req.body);
    //resp.send("U are Signedup with Id="+req.body.txtMail);
});

//=======================================================================================================//


//=======================NODEMAILER=======================================//

// Set up the nodemailer transporter=====================================//
var transporter = nodemailer.createTransport({
    secure: false,
    host: 'smtp.gmail.com',
    auth: {
        user: 'thefacebookjeetsingh@gmail.com',
        pass: 'ncfiqnlcqcgkawnc', 
    }
})


app.post("/SendFeedback",function (req,resp){
    var Fname=req.body.feedname;// ethe ohi textboxes de names 
    var address=req.body.address;
    var cont =req.body.contact;
    var feed=req.body.feedback; //ethe v 
//  email content
var subject = "Feedback from "+Fname ;
var message = "<h2> Address : </h2>"+address+"<h2>Conact : </h2>"+cont+"<h1>Feedback</h1>"+feed+"";
// Send email
transporter.sendMail({
    to:"thefacebookjeetsingh@gmail.com",
    subject: subject,
    html: message
})
    console.log("Email sent");
    resp.send("Feedback sent successfully!");
})

//=================================================================================//