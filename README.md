# Simple Firebase Auth (Email/Password)

1) Install deps (already added): `npm install`

2) Add your Firebase web config in `src/firebase.js`:

```
const firebaseConfig = {
  apiKey: '...'
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: '...'
  appId: '...'
}
```

Find it in Firebase Console → Project settings → Your apps → SDK setup and configuration.

3) Enable Authentication → Sign-in method → Email/Password in Firebase Console.

4) Run the app: `npm start` then open http://localhost:3000

# Getting Started with Create React App

## Role-based setup (Admin, Staff, Customer)

- Customer registersจากหน้า Register (role จะเป็น `customer` อัตโนมัติ)
- Admin ให้สร้างบัญชีครั้งแรกผ่าน Firebase Console (Auth) แล้วไปที่ `users/{uid}` ใน Firestore ใส่ `role: "admin"`
- เมื่อมี Admin แล้ว ให้ผู้พนักงาน/ผู้เบิกสมัครหรือแอดมินสมัครให้ชั่วคราว จากนั้นแอดมินเข้า `Admin → Manage Users` เปลี่ยน `role` เป็น `staff`

เส้นทางหลักหลังล็อกอินจะเปลี่ยนตาม role:
- Admin → `/admin` (จัดการผู้ใช้ `/admin/users`)
- Staff → `/staff`
- Customer → `/customer`

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

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
