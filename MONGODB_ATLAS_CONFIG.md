# 🌐 Configuration MongoDB Atlas

## ✅ Ce que tu dois faire maintenant :

### 1️⃣ Obtenir ta Connection String

Sur MongoDB Atlas :
1. Va dans **Database** → **Connect**
2. Choisis **Drivers**
3. Copie la connection string qui ressemble à :

```
mongodb+srv://gameadmin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

**⚠️ IMPORTANT** : Remplace `<password>` par ton vrai mot de passe !

### 2️⃣ Exemple de Connection String complète

Si ton username est `gameadmin` et ton password est `MonMotDePasse123`, ça donne :

```
mongodb+srv://gameadmin:MonMotDePasse123@cluster0.abcdef.mongodb.net/?retryWrites=true&w=majority
```

### 3️⃣ Mettre à jour server.js

Ouvre le fichier `server.js` et remplace la ligne 17 :

**Avant :**
```javascript
const MONGODB_URI = "COLLE_TA_CONNECTION_STRING_ICI";
```

**Après :**
```javascript
const MONGODB_URI = "mongodb+srv://gameadmin:MonMotDePasse123@cluster0.abcdef.mongodb.net/?retryWrites=true&w=majority";
```

### 4️⃣ Lancer le projet

```bash
npm start
```

Si tu vois le message **✅ Connecté à MongoDB**, c'est bon ! 🎉

---

## 🆘 Problèmes courants

### ❌ Erreur "MongoServerError: bad auth"
→ Vérifie que ton mot de passe est correct dans la connection string

### ❌ Erreur "MongoServerSelectionError"
→ Va dans **Network Access** sur Atlas et ajoute `0.0.0.0/0` pour autoriser toutes les IP

### ❌ Erreur avec caractères spéciaux dans le mot de passe
→ Si ton mot de passe contient des caractères spéciaux (@, !, etc.), il faut les encoder :
- Va sur : https://www.urlencoder.org/
- Encode juste le mot de passe
- Utilise le résultat dans la connection string

