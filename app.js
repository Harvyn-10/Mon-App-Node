const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const port = 8080;

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/Users', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connexion à MongoDB réussie'))
    .catch(err => console.error('Erreur de connexion à MongoDB', err));

// Définir le schéma de l'utilisateur
const userSchema = new mongoose.Schema({
    nom: String,
    prenom: String,
    login: String,
    mdp: String
});

const User = mongoose.model('User', userSchema);

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

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

app.post('/', async (req, res) => {
    const { nom, prenom, login, mdp, confirmMdp } = req.body;
    if (mdp !== confirmMdp) {
        return res.send('Les mots de passe ne correspondent pas. Veuillez réessayer.');
    }

    try {
        let user = await User.findOne({ nom, prenom });
        if (user) {
            user.login = login;
            user.mdp = mdp;
            await user.save();
            res.send(`Bonjour ${prenom} ${nom}, votre compte a été mis à jour.`);
        } else {
            user = new User({ nom, prenom, login, mdp });
            await user.save();
            res.send(`Bonjour ${prenom} ${nom}, ton compte est bien créé.`);
        }
    } catch (err) {
        console.error('Erreur lors de la gestion de l\'utilisateur:', err);
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
    console.log(`Serveur démarré sur http://localhost:${port}`);
});
