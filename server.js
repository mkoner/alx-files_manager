import router from './routes/index';

const express = require('express');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.use('/', router);

app.listen(port, () => {
  console.log('Server listening to port ', port);
});
