# Tableau de Bord de Gestion de Maternelle

Application de gestion complète pour les écoles maternelles avec suivi des enfants, des enseignants et des activités.

## 🚀 Déploiement sur Vercel

### Prérequis
- Compte [Vercel](https://vercel.com)
- Compte [GitHub](https://github.com)
- Node.js 14+ et npm installés localement

### Variables d'Environnement
Créez un fichier `.env.local` à la racine du projet avec les variables suivantes :
```
REACT_APP_API_URL=https://votre-backend.vercel.app/api
# Autres variables d'environnement si nécessaire
```

### Déploiement Automatique
1. Poussez votre code sur GitHub
2. Connectez-vous à [Vercel](https://vercel.com)
3. Cliquez sur "New Project"
4. Importez votre dépôt GitHub
5. Configurez les paramètres :
   - Framework: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`
6. Ajoutez les variables d'environnement
7. Cliquez sur "Deploy"

## 📦 Installation en Local

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/votre-utilisateur/kindergarten-frontend.git
   cd kindergarten-frontend
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Lancez l'application en mode développement :
   ```bash
   npm start
   ```
   L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

## 🛠 Commandes Utiles

- `npm start` - Lance l'application en mode développement
- `npm run build` - Construit l'application pour la production
- `npm test` - Lance les tests
- `npm run eject` - Sort de Create React App (irréversible)

## 🌍 Internationalisation
L'application prend en charge plusieurs langues via i18n. Les fichiers de traduction sont dans le dossier `public/locales`.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
