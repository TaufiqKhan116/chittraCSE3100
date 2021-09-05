const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();
const { expressCspHeader, NONCE } = require('express-csp-header');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut   } = require('firebase/auth');
const { getDatabase, ref, set, get, update } = require('firebase/database');
const { initializeApp } = require('firebase/app');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended:false }));
app.use(express.json());

const firebaseConfig = {
  apiKey: "AIzaSyBNc1hX8l6zT1or8SWzO_1rG6Hyv5b5wns",
  authDomain: "chittranodemcuprojectcse3100.firebaseapp.com",
  databaseURL: "https://chittranodemcuprojectcse3100-default-rtdb.firebaseio.com/",
  projectId: "chittranodemcuprojectcse3100",
  storageBucket: "chittranodemcuprojectcse3100.appspot.com",
  messagingSenderId: "122247735307",
  appId: "1:122247735307:web:d1d44d0f585291cc597f0e",
  measurementId: "G-162030LSY5",
}
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth();
var database = getDatabase();
var user = null;

router.get('/', function(req,res) {
  res.set("Content-Security-Policy", "default-src 'self';script-src 'unsafe-inline';");
  res.render('index', { errorMsg:'', username:'' })
});

router.post('/signup', function(req, res) {
    var email = req.body.email;
    var password = req.body.password;
    var cpassword = req.body.confirm_password
    if(email === '' || password === '' || cpassword === '') {
      res.render('index', { errorMsg:'Required field empty!', username:'' })
    } else if(password != cpassword) {
      res.render('index', { errorMsg:'Password did not match!', username:'' })
    } else {
      createUserWithEmailAndPassword(auth, req.body.email, req.body.password)
      .then((userCredentials) => {
        user = userCredentials.user;
        console.log(user)
        res.render('index', { errorMsg:'', username:'' })
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode)
        res.render('index', { errorMsg:errorMessage, username:'' })
      })
    }
})

router.post('/login', function(req, res) {
  var email = req.body.email;
  var password = req.body.password;
  var arr = []
  if(email === '' || password === '') {
    res.render('index', { errorMsg:'Required field empty!', username:'' })
  } else {
    signInWithEmailAndPassword(auth, req.body.email, req.body.password)
    .then((userCredentials) => {
      user = userCredentials.user;
      get(ref(database)).then((snapshot) => {
        if (snapshot.exists()) {
          for(const key in snapshot.val()) {
            if(snapshot.val()[key].email === user.email) {
              console.log(snapshot.val()[key])
              arr.push({mac:key, isOscillating:snapshot.val()[key].isOscillating})
            }
          }
          res.render('userpanel', { list:arr, errorMsg:'', username:user.email })
        } else {
          console.log("No data available");
          res.render('userpanel', {  list:null, errorMsg:'Required field empty!', username:user.email  })
        }
      }).catch((error) => {
        console.error(error);
      })
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(errorCode)
      res.render('index', { errorMsg:errorMessage, username:'' })
    })
  }
})

router.get('/logout', function(req, res) {
  signOut(auth).then(() => {
    res.render('index', { errorMsg:'', username:'' })
  }).catch((error) => {
    console.log(error)
  });
})

router.post('/register', function(req, res) {
  if(req.body.mac_address == '') {
    res.render('userpanel', {  list:null, errorMsg:'Required field empty!', username:user.email  })
  } 
  else {
    set(ref(database, req.body.mac_address), {
      isOscillating: false,
      email: user.email
    })
    var arr = []
    get(ref(database)).then((snapshot) => {
      if (snapshot.exists()) {
        for(const key in snapshot.val()) {
          if(snapshot.val()[key].email === user.email) {
            console.log(snapshot.val()[key])
            arr.push({mac:key, isOscillating:snapshot.val()[key].isOscillating})
          }
        }
        res.render('userpanel', { list:arr, errorMsg:'', username:user.email })
      } else {
        console.log("No data available");
        res.render('userpanel', {  list:null, errorMsg:'Required field empty!', username:user.email  })
      }
    }).catch((error) => {
      console.error(error);
    })
  }
})

router.get('/:mac', function(req, res) {
  console.log(req.params.mac)

  var macAddress = req.params.mac
  var oscFlag = false

  const updates = {}
  const data = {}

  get(ref(database, '/' + macAddress)).then((snapshot) => {
    if (snapshot.exists()) {
      console.log(snapshot.val())
      oscFlag = snapshot.val().isOscillating;

      updates[macAddress + '/isOscillating'] = !oscFlag
      oscFlag = !oscFlag
      data['osc'] = oscFlag
      data['btn'] = oscFlag ? 'Stop' : 'Start';
      console.log(data)
      update(ref(database), updates)
      res.writeHead(200, {'Content-Type' : 'application/json'})
      res.end(JSON.stringify(data))
    } else {
      console.log("No data available");
    }
  }).catch((error) => {
    console.error(error);
  })
})


//add the router
app.use('/', router);
app.listen(process.env.port || 3000);

console.log('Running at Port 3000');