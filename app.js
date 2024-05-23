const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const app = express();
const port = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

mongoose.connect('mongodb://localhost:27017/Users', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connexion à MongoDB réussie'))
    .catch(err => console.error('Erreur de connexion à MongoDB', err));


const userSchema = new mongoose.Schema({
    nom: String,
    prenom: String,
    avatar:String,
    login: String,
    mdp: String
});

userSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('mdp')) {
        try {
            const salt = await bcrypt.genSalt(10);
            user.mdp = await bcrypt.hash(user.mdp, salt);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

const User = mongoose.model('User', userSchema);



const coursData = {
    1: { titre: 'Mathématiques', descriptif: 'Cours de mathématiques avancées', enseignants: ['Prof. Dupont', 'Prof. Martin'] },
    2: { titre: 'Physique', descriptif: 'Cours de physique fondamentale', enseignants: ['Prof. Einstein', 'Prof. Curie'] },
    3: { titre: 'SVT', descriptif: 'Cours de science de la Vie et de la Terre', enseignants: ['Prof. Charlie', 'Prof. Annie'] },
    4: { titre: 'Chimie', descriptif: 'Cours de chimie', enseignants: ['Prof. Tanoh', 'Prof. Jeanne'] },
    5: { titre: 'Philosophie', descriptif: 'Cours de philosophie', enseignants: ['Prof. Marc', 'Prof. Arthur'] },
};

app.use((req, res, next) => {
    console.log(`Route demandée : ${req.url}`);
    next();
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/sign.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sign.html'));
});

app.get('/user.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'user.html'));
});

app.post('/', upload.single('avatar'), async (req, res) => {
    const { nom, prenom, login, mdp, confirmMdp } = req.body;
    if (mdp !== confirmMdp) {
        return res.send('Les mots de passe ne correspondent pas. Veuillez réessayer.');
    }
    try {
        const imagePath = req.file.path;
        const user = new User({
            nom,
            prenom,
            avatar: imagePath,
            login,
            mdp
        });
        await user.save();
        res.redirect('./success.html')
    } catch (err) {
        console.error('Erreur lors de la création de l\'utilisateur:', err);
        res.status(500).send('Erreur interne du serveur');
    }
});



app.get('/about', (req, res) => {
    console.log('envoie des infos');
    res.send('auteur : ...');
});

app.get('/private', (req, res) => {
    res.send('Section privée');
});

app.get('/private/mine', (req, res) => {
    res.send('Ma section privée');
});

app.get('/pictures', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'pexels-matt-hardy-2624109.jpg');
    res.sendFile(filePath, (err) => {
        if (err) {
            if (err.code === 'ENOENT') {
                console.error('Fichier non trouvé:', filePath);
                res.status(404).send('Fichier non trouvé');
            } else {
                console.error('Erreur serveur:', err);
                res.status(500).send('Erreur interne du serveur');
            }
        }
    });
});

app.get('/cours/:numeroducours/descr', (req, res) => {
    const numeroDuCours = req.params.numeroducours;
    const cours = coursData[numeroDuCours];
    if (cours) {
        res.render('cours', {
            titre: cours.titre,
            descriptif: cours.descriptif,
            enseignants: cours.enseignants
        });
    } else {
        res.status(404).send('Cours non trouvé');
    }
});

app.use((req, res) => {
    res.status(404).send('Page non trouvée');
});

app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
});
