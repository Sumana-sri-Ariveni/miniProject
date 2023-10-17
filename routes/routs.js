const express = require('express');
const session = require('express-session');   //sessions to store username and gender
const router = express.Router();

// const multer = require('multer');   // to handle photo to store in db
// const storage = multer.memoryStorage(); // Store files in memory, or change to store on disk

// const upload = multer({ storage: storage });

var passwordHash = require('password-hash');   //using password-hash to hash password

// session
router.use(session({
    secret: 'userName and Gender', // Change this to a secure random string
    resave: false,
    saveUninitialized: true,
}));

// db connection
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore , Filter} = require('firebase-admin/firestore');

var serviceAccount = require("../key.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

//routes for student

// dashboard
router.get("/",(req,res)=>{
    res.render("dashboard");
})

// route for login or signup buttion in dashboard
router.get("/loginSignup",(req,res)=>{
    res.render("loginSignup");
})

const isAuthnticated = (req,res,next) =>{
    if(req.session.isAuthnticated){
        next()
    }else{
        res.render("loginSignup");
    }
}

const isBooked = (req, res, next) => {
    if(req.session.isBooked){
        next();
    }
    db.collection("userBooking")
    .where("userName", "==", req.session.userName)
    .get()
    .then((docs) => {
        let booked = false;
        docs.forEach((doc) => {
            console.log(doc.data());
            if (doc.data().userName == req.session.userName) {
                booked = true;
                req.session.isBooked = true;
                req.session.hostelName = doc.data().hostelName;
                req.session.hostelRoom = doc.data().hostelRoom;
                req.session.hostelFloor = doc.data().hostelFloor;
                console.log(req.session.hostelName, req.session.hostelFloor, req.session.hostelRoom);
            }
            else{
                req.session.isBooked = false;
            }
        });
        console.log(booked);
        next(); // Call next() inside the .then() block
    })
    .catch((error) => {
        // Handle any errors here
        console.error("Error in database query:", error);
        next(); // Ensure that next() is called even in case of an error
    });
};

router.get('/render-boyshostel', (req, res) => {
    const selectedOption = req.query.selectedOption;

    if (selectedOption === 'ASR') {
        res.status(200).render('../components/asrHostel'); // 200 OK for a successful response
    } else if (selectedOption === 'VSR') {
        res.status(200).render('../components/vsrHostel'); // 200 OK for a successful response
    } else if (selectedOption === 'VVK') {
        res.status(200).render('../components/vvkHostel'); // 200 OK for a successful response
    } else {
        res.status(404).send('Not Found'); // 404 Not Found for an unknown resource
    }
});


router.get('/render-girlshostel', (req, res) => {
    const selectedOption = req.query.selectedOption;

    if (selectedOption === 'sumedha') {
        res.status(200).render('../components/sumedhaHostel'); // 200 OK for a successful response
    } else if (selectedOption === 'sahithi') {
        res.status(200).render('../components/sahithiHostel'); // 200 OK for a successful response
    } else if (selectedOption === 'triveni') {
        res.status(200).render('../components/triveniHostel'); // 200 OK for a successful response
    } else {
        res.status(404).send('Not Found'); // 404 Not Found for an unknown resource
    }
});


// rought for login
router.post("/login", (req, res) => {
    console.log(req.body);
    db.collection("usersLogins")
        .where("userName", "==", req.body.loginUserName)
        .get()
        .then((docs) => {
            let verified = false;
            docs.forEach((doc) => {
                verified = passwordHash.verify(req.body.loginPassword, doc.data().password);
                console.log(verified);
            });

            if (verified) {
                db.collection("usersProfile")
                    .where("userName", "==", req.body.loginUserName)
                    .get()
                    .then((docs) => {
                        let createdProfile = false;
                        docs.forEach((doc) => {
                            if (doc.data().userName == req.body.loginUserName) {
                                createdProfile = true;
                                if (createdProfile) {
                                    req.session.userName = req.body.loginUserName;
                                    req.session.studentLastName = doc.data().studentLastName;
                                    req.session.studentFirstName = doc.data().studentFirstName;
                                    req.session.gender = doc.data().gender;
                                    req.session.studentDateofbirth = doc.data().studentDateofbirth;
                                    req.session.studentNumber = doc.data().studentNumber;
                                    req.session.studentStream = doc.data().studentStream;
                                    req.session.studentBranch = doc.data().studentBranch;
                                    req.session.studentYear = doc.data().studentYear;
                                    req.session.studentFatherName = doc.data().studentFatherName;
                                    req.session.studentFatherNumber = doc.data().studentFatherNumber;
                                    req.session.studentMotherName = doc.data().studentMotherName;
                                    req.session.studentMotherNumber = doc.data().studentMotherNumber;
                                }
                            }
                        });
                        req.session.isAuthnticated = true;
                        if (!createdProfile) {
                            req.session.userName = req.body.loginUserName;
                            console.log('session created profile', req.session.userName);
                            res.status(200).render("profile"); // Render the profile page with a 200 OK status
                        } else {
                            console.log('session created index', req.session.userName);
                            res.status(200).render("index", {
                                userName: req.session.userName,
                                studentName: req.session.studentFirstName + req.session.studentLastName,
                                studentDateofbirth: req.session.studentDateofbirth,
                                studentPhoneNumber: req.session.studentNumber,
                                studentStream: req.session.studentStream,
                                studentBranch: req.session.studentBranch,
                                studentYear: req.session.studentYear,
                                studentFatherName: req.session.studentFatherName,
                                studentFatherNumber: req.session.studentFatherNumber,
                                studentMotherName: req.session.studentMotherName,
                                studentMotherNumber: req.session.studentMotherNumber
                            }); // Render the index page with a 200 OK status
                        }
                    });
            } else {
                res.status(401).send("Unauthorized: Username and password do not match"); // 401 Unauthorized status for invalid credentials
            }
        });
});


// route for signup
router.post("/signup", (req, res) => {
    console.log(req.body);
    const phoneNumber = req.body.phoneNumber;
    const userName = req.body.signupUserName;
    const password = passwordHash.generate(req.body.signupPassword);

    db.collection("usersLogins")
        .where(
            Filter.or(
                Filter.where("phoneNumber", "==", phoneNumber),
                Filter.where("userName", "==", userName)
            )
        )
        .get()
        .then((docs) => {
            if (docs.size > 0) {
                res.status(400).send("Bad Request: This account already exists with the phone number or username"); // 400 Bad Request status for duplicate account
            } else {
                db.collection("usersLogins")
                    .add({
                        userName: userName,
                        phoneNumber: phoneNumber,
                        password: password,
                    })
                    .then(() => {
                        req.session.isAuthnticated = true;
                        req.session.userName = req.body.signupUserName;
                        res.status(200).render("profile"); // 200 OK status for successful signup
                    })
                    .catch((error) => {
                        res.status(500).send("Internal Server Error: " + error.message); // 500 Internal Server Error for server issues
                    });
            }
        })
        .catch((error) => {
            res.status(500).send("Internal Server Error: " + error.message); // 500 Internal Server Error for server issues
        });
});

  
//main file route
router.get("/main", isAuthnticated,(req,res)=>{
    // console.log(req.session.studentStream,req.session.studentBranch,req.session.studentYear);

    res.status(200).render("index",{ userName : req.session.userName,
        studentName : req.session.studentFirstName + req.session.studentLastName ,
        studentDateofbirth : req.session.studentDateofbirth ,
        studentPhoneNumber : req.session.studentNumber , 
        studentStream : req.session.studentStream ,
        studentBranch : req.session.studentBranch ,
        studentYear : req.session.studentYear,
        studentFatherName : req.session.studentFatherName , 
        studentFatherNumber : req.session.studentFatherNumber , 
        studentMotherName : req.session.studentMotherName , 
        studentMotherNumber : req.session.studentMotherNumber});
});

// route for profile page
router.get("/profile", isAuthnticated,(req,res)=>{
    res.render("profile");
});

// route to save profile
router.post("/saveProfile", isAuthnticated, async(req,res)=>{
    // if(req.session){
    //     console.log(req.session);
    // }
    // else{
    //     console.log("no session creatd");
    // }
    const { studentImg,
        studentFirstName,
        studentLastName,
        gender,
        studentDateOfbirth,
        studentNumber,
        studentStream,
        studentBranch,
        studentYear,
        studentFatherName,
        studentFatherNumber,
        studentMotherName,
        studentMotherNumber
    } = req.body;
    // const file = req.file;
    // const userRef = db.collection('usersProfile').doc(userRecord.uid);

    // await userRef.set({
    //   imageURL: '', // This will be the URL of the stored image
    // });

    // // Upload the image to Firebase Storage
    // const bucket = admin.storage().bucket();
    // const fileBlob = bucket.file(userRecord.uid + '-' + file.originalname);

    // const stream = fileBlob.createWriteStream({
    //   metadata: {
    //     contentType: file.mimetype,
    //   },
    // });

    // stream.end(file.buffer);

    // stream.on('finish', async () => {
    //   const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileBlob.name}`;

    //   // Update the user data with the image URL
    //   await userRef.update({
    //     imageURL: imageUrl,
    //   });

    //   console.log("image uploded sucessfully");
    // });

    // stream.on('error', (err) => {
    //   console.error(err);
    // });
        req.session.studentLastName = studentLastName;
        req.session.studentFirstName = studentFirstName;
        req.session.gender = gender;
        req.session.studentDateofbirth= studentDateOfbirth;
        req.session.studentNumber = studentNumber;
        req.session.studentStream = studentStream,
        req.session.studentBranch = studentBranch,
        req.session.studentYear = studentYear,
        req.session.studentFatherName = studentFatherName;
        req.session.studentFatherNumber = studentFatherNumber;
        req.session.studentMotherName = studentMotherName;
        req.session.studentMotherNumber = studentMotherNumber;
    // console.log(req.body);
    // console.log(req.session.studentStream,req.session.studentBranch,req.session.studentYear);
    db.collection("usersProfile")
    .add({
        userName: req.session.userName,
        photo : studentImg,
        studentFirstName : studentFirstName,
        studentLastName : studentLastName,
        gender : gender,
        studentDateofbirth : studentDateOfbirth,
        studentNumber : studentNumber,
        studentStream : studentStream,
        studentYear : studentYear,
        studentBranch : studentBranch,
        studentFatherName : studentFatherName,
        studentFatherNumber : studentFatherNumber,
        studentMotherName : studentMotherName,
        studentMotherNumber :studentMotherNumber,
    })
    .then(() => {
        res.render("index",{ userName : req.session.userName,
            studentName : req.session.studentFirstName + req.session.studentLastName ,
            studentDateofbirth : req.session.studentDateofbirth ,
            studentPhoneNumber : req.session.studentNumber , 
            studentStream : req.session.studentStream ,
            studentBranch : req.session.studentBranch ,
            studentYear : req.session.studentYear,
            studentFatherName : req.session.studentFatherName , 
            studentFatherNumber : req.session.studentFatherNumber , 
            studentMotherName : req.session.studentMotherName , 
            studentMotherNumber : req.session.studentMotherNumber});
    })
    .catch((error) => {
        res.send("Something went wrong: " + error.message);
    });
});

// route for to get family details form
router.get("/familydetails", isAuthnticated,(req,res)=>{
    res.render("studentFamilydetails");
});

// rought for hostel booking
router.get("/Alloted", isAuthnticated, isBooked,(req,res)=>{
    console.log(req.session.userName,req.session.isBooked,req.session.hostelName, req.session.hostelFloor, req.session.hostelRoom);
    res.render("notAlloted",{ booked : req.session.isBooked ,
        gender : req.session.gender ,
        hostelName : req.session.hostelName ,
        hostelFloor : req.session.hostelFloor ,
        hostelRoom : req.session.hostelRoom
    })  
});

// rought to give any complaint
router.post("/complaint", isAuthnticated, (req, res) => {
    // console.log(req.body.complaint,req.session.userName,req.session.hostelName,req.session.hostelFloor,req.session.hostelRoom)
    const userName = req.session.userName;
    // console.log(userName);
    const isBooked = req.session.isBooked; // Assuming isBooked is stored in the session
    
    if (isBooked === true) {
        const userComplaintsRef = db.collection('userComplaints');
        const complaint = req.body.complaint; // Assuming you have the complaint data available in req.data

        userComplaintsRef.add({
            userName: userName,
            hostelName : req.session.hostelName,
            hostelRoom : req.session.hostelRoom,
            hostelFloor : req.session.hostelFloor,
            gender : req.session.gender,
            complaint: complaint
        })
        .then((docRef) => {
            const userComplaintsRef = db.collection('userComplaints');
    
            userComplaintsRef
            .where('userName', '==', userName)
            .get()
            .then((querySnapshot) => {
                const complaints = [];

                querySnapshot.forEach((doc) => {
                    complaints.push(doc.data().complaint);
                });
                // complaints.forEach((complaint, index) => {
                //     console.log(`Complaint ${index + 1}:`, complaint);
                // });
                res.render("issues", { message: "we have received your complaint,we are working on your issues, we will complete it soon", complaints: complaints });
            })
            .catch((error) => {
                console.error("Error getting complaints:", error);
                res.status(500).send("Error retrieving complaints");
            });
            // console.log("Complaint stored with ID: ", docRef.id);
            // res.render("issues", { message: "we have received your complaint, we are working on your issues, we will complete it soon", complaints: complaint });
        })
        .catch((error) => {
            console.error("Error storing complaint:", error);
            res.status(500).send("Error storing complaint.");
        });
    } else {
        res.send("Hostelers should only give an issue.");
    }
});

// issues route
router.get("/issues", isAuthnticated, isBooked, (req, res) => {
    const userName = req.session.userName;
    const userComplaintsRef = db.collection('userComplaints');
    
    userComplaintsRef
        .where('userName', '==', userName)
        .get()
        .then((querySnapshot) => {
            const complaints = [];

            querySnapshot.forEach((doc) => {
                complaints.push(doc.data().complaint);
            });
            // complaints.forEach((complaint, index) => {
            //     console.log(`Complaint ${index + 1}:`, complaint);
            // });

            res.render("issues", { message: "we are working on your issues, we will complete it soon", complaints: complaints });
        })
        .catch((error) => {
            console.error("Error getting complaints:", error);
            res.status(500).send("Error retrieving complaints");
        });
});

// route to ssee payment details
router.get("/payments", isAuthnticated,(req,res)=>{
    res.render("payments",{ studentName : req.session.studentFirstName+req.session.studentLastName,
        studentStream : req.session.studentStream,
        studentBranch : req.session.studentBranch,
        studentYear : req.session.studentYear,
        studentMobileNumber : req.session.studentNumber
    });
});

// route to see online recipts
router.get("/onlineRecipts", isAuthnticated,(req,res)=>{
    res.render("onlineRecipts");
});

// route to bookHostel form
router.post("/bookRoom", isAuthnticated,(req,res)=>{
    console.log(req.body)
    db.collection('userBooking')
    .where('hostelRoom','==',req.body.hostelRoom)
    .get()
    .then((docs) => {
        if (docs.size >= 4) {
            res.send("Sorry, This room is already booked");
        } else {
            req.session.dummyhostelname = req.body.hostelName;
            req.session.dummyRoomNumber = req.body.hostelRoom;
            req.session.dummyFloorNumber = req.body.hostelFloor;
            res.render("../components/studentFamilyDetails");        
        }
    })
    .catch((error) => {
        res.send("Something went wrong: " + error.message);
    });
});

router.post("/continueToPay",isAuthnticated,(req,res)=>{
    const {userName,
        guardian1pic,
        guardian1Name,
        guardian1Phone,
        guardian1Relation,
        guardian2pic,
        guardian2Name,
        guardian2Phone,
        guardian2relation
    } = req.body;
    if(userName == req.session.userName){
        db.collection('userBooking')
        .add({
            userName : req.session.userName,
            hostelName : req.session.dummyhostelname,
            hostelFloor : req.session.dummyFloorNumber,
            hostelRoom : req.session.dummyRoomNumber,
            gender : req.session.gender
        })
        .then(()=>{
            console.log("Session stored sucessfully");
        })
        .catch((error) => {
            res.send("Something went wrong: " + error.message);
        });

        db.collection('usersGuardiansDetails')
        .add({
            userName : userName,
            guardian1pic : guardian1pic,
            guardian1Name : guardian1Name,
            guardian1Phone : guardian1Phone,
            guardian1Relation : guardian1Relation,
            guardian2pic : guardian2pic,
            guardian2Name : guardian2Name,
            guardian2Phone : guardian2Phone,
            guardian2relation : guardian2relation
        })
        .then(()=>{
            req.session.hostelName = req.session.dummyhostelname;
            req.session.hostelFloor = req.session.dummyFloorNumber;
            req.session.hostelRoom = req.session.dummyRoomNumber;
            req.session.isBooked = true;
            res.render("notAlloted",{ booked : req.session.isBooked ,
                gender : req.session.gender ,
                hostelName : req.session.hostelName ,
                hostelFloor : req.session.hostelFloor ,
                hostelRoom : req.session.hostelRoom
            })
        })
        .catch((error) => {
            console.log("Hostel booked sucessfully");
            res.send("Something went wrong: " + error.message);
        });
    }
    else{
        res.send('student user name not matched please check the details and try again');
    }
});

// logout destroys the sessions
router.get("/logout",(req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
      } else {
        console.log("Session has been destroyed.");
      }
      // Redirect the user to the login page or another appropriate location
      res.redirect("/");
    });
});

// waste route
router.get("/getSessionData", (req, res) => {
    const sessionData = req.session; // Get all session data
  
    // Use sessionData as needed, e.g., log it or send it as a JSON response
    console.log("Session data:", sessionData);

});

// routes for admin
router.get("/adminLogin",(req,res)=>{
    res.render('../components/adminLogin');
});

// route to admin login form 
router.post("/adminLogin", (req, res) => {
    db.collection("adminLoginDetails")
      .where("adminUserName", "==", req.body.adminUserName)
      .get()
      .then((docs) => {
        if (docs.size === 0) {
          // No matching username found, send a response
          res.status(500).send("User not registered.");
          return;
        }
  
        let verified = false;
  
        docs.forEach((doc) => {
          // Verify the password using passwordHash (assuming it's working correctly)
          verified = passwordHash.verify(req.body.adminPassword, doc.data().adminPassword);
  
          if (verified) {
            req.session.adminFor = doc.data().adminFor;
            req.session.adminUserName = req.body.adminUserName;
            console.log(req.session.adminFor, req.session.adminUserName);
  
            // Now, let's fetch data from the 'userBooking' collection for all users
            db.collection("userBooking")
              .get()
              .then((bookingDocs) => {
                const bookingData = [];
  
                bookingDocs.forEach((bookingDoc) => {
                  if (bookingDoc.data().gender == req.session.adminFor) {
                    const data = {
                      hostelFloor: bookingDoc.data().hostelFloor,
                      hostelName: bookingDoc.data().hostelName,
                      hostelRoom: bookingDoc.data().hostelRoom,
                      userName: bookingDoc.data().userName,
                      gender: bookingDoc.data().gender,
                    };
                    bookingData.push(data);
                  }
                });
                console.log('this booking data :', bookingData);
                // Render the adminHomePage with the formatted data
                req.session.isAuthnticated = true;
                res.status(200).render('../components/adminHomePage', { bookingData: bookingData });
              })
              .catch((err) => {
                console.log("Error fetching data from 'userBooking' collection:", err);
                res.status(500).send('<p style="color: red; font-weight: bold; font-size: 16px;" >An error occurred while fetching user booking data.</p>');
              });
          } else {
            res.status(500).send('<p style="color: red; font-weight: bold; font-size: 16px;" >User name and password does not matched</p>');
          }
        });
      })
      .catch((err) => {
        console.log("Error fetching data from the database", err);
        res.status(500).send('<p style="color: red; font-weight: bold; font-size: 16px;">Something went wrong while fetching data from the database.</p>');
      });
});

router.get('/adminSignup',(req,res)=>{
    res.render('../components/adminSignup')
    
});

router.post('/adminSignup',(req,res)=>{
    const {adminUserName, adminFor , adminPhoneNumber , adminSignupPassword } = req.body;
    console.log(adminUserName, adminFor , adminPhoneNumber , adminSignupPassword );
    const password = passwordHash.generate(adminSignupPassword);

    db.collection("adminLoginDetails")
    .where(
        Filter.or(
            Filter.where("phoneNumber", "==", adminPhoneNumber),
            Filter.where("userName", "==", adminUserName)
        )
    )
    .get()
    .then((docs) => {
        if (docs.size > 0) {
            res.status(500).send("Sorry, This account already exists with the phone number or username");
        } else {
            db.collection("adminLoginDetails")
            .add({
                adminUserName: adminUserName,
                adminFor : adminFor,
                adminPhoneNumber: adminPhoneNumber,
                adminPassword: password,
            })
            .then(() => {
                res.status(200).render('../components/adminLogin');
            })
            .catch((error) => {
                res.status(500).send('<p style="color: red; font-weight: bold; font-size: 16px;">Something went wrong:+'+error.message+' </p>');
            });
        }
    })
    .catch((error) => {
        res.status(500).send('<p style="color: red; font-weight: bold; font-size: 16px;">Error querying Firestore:'+ error.message+' </p>');
    });
});

// admin complaints display
router.get('/adminComplaints', isAuthnticated,(req,res)=>{
    db.collection("userComplaints")
    .get()
    .then((bookingDocs) => {
    const complaintsData = [];

    bookingDocs.forEach((complaintDoc) => {
        if (complaintDoc.data().gender == req.session.adminFor) {
        const data = {
            hostelFloor: complaintDoc.data().hostelFloor,
            hostelName: complaintDoc.data().hostelName,
            hostelRoom: complaintDoc.data().hostelRoom,
            userName: complaintDoc.data().userName,
            complaint : complaintDoc.data().complaint
        };
        complaintsData.push(data);
        }
    });
    console.log('this complaint data :', complaintsData);
    // Render the adminComplaints with the data
    res.status(200).render('../components/adminComplaints', { complaintsData: complaintsData });
    })
    .catch((err) => {
        console.log("Error fetching data from 'usercomplaint' collection:", err);
        res.status(500).send('<p style="color: red; font-weight: bold; font-size: 16px;">An error occurred while fetching user complaint data.</p>');
    }); 
});

router.get('/adminHome', isAuthnticated,(req,res)=>{
    db.collection("userBooking")
    .get()
    .then((bookingDocs) => {
    const bookingData = [];

    bookingDocs.forEach((bookingDoc) => {
        if (bookingDoc.data().gender == req.session.adminFor) {
        const data = {
            hostelFloor: bookingDoc.data().hostelFloor,
            hostelName: bookingDoc.data().hostelName,
            hostelRoom: bookingDoc.data().hostelRoom,
            userName: bookingDoc.data().userName,
            gender: bookingDoc.data().gender,
        };
        bookingData.push(data);
        }
    });
    console.log('this booking data :', bookingData);
    // Render the adminHomePage with the formatted data
    res.status(200).render('../components/adminHomePage', { bookingData: bookingData });
    })
    .catch((err) => {
    console.log("Error fetching data from 'userBooking' collection:", err);
    res.status(500).send('<p style="color: red; font-weight: bold; font-size: 16px;">An error occurred while fetching user booking data.</p>');
    });
});

router.post('/getStudentDetails',isAuthnticated,(req,res)=>{
    const userName = req.body.userName;
    db.collection('usersProfile')
    .where('userName','==',userName)
    .get()
    .then((studentDetails) => {
        const studentData = [];
    
        studentDetails.forEach((details) => {
            const data = {
                userName : details.data().userName,
                studentYear : details.data().studentYear,
                studentBranch : details.data().studentBranch,
                studentDateofbirth : details.data().studentDateofbirth,
                studentFatherName : details.data().studentFatherName,
                studentName : details.data().studentFirstName + details.data().studentLastName,
                studentMotherName : details.data().studentMotherName,
                studentMotherNumber : details.data().studentMotherNumber,
                studentFatherNumber : details.data().studentFatherNumber,
                studentNumber : details.data().studentNumber,
                studentStream : details.data().studentStream
            };
            studentData.push(data);
        });
        console.log('this is student data :', studentData);
        // Render the adminHomePage with the formatted data
        res.render("../components/getStudentData",{ studentData : studentData });
        })
        .catch((err) => {
        console.log("Error fetching data from 'userBooking' collection:", err);
        res.status(500).send('<p style="color: red; font-weight: bold; font-size: 16px;">An error occurred while fetching user booking data.</p>');
        });
});

module.exports = router;
