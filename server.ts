// simple express server serving an index.html file
import express from 'express';
import path from 'path';

const app = express();
const port = 3000;

app.use('/img', express.static( path.join(__dirname, 'public/img')));
app.use('/', express.static(path.join(__dirname, 'dist')));

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}/`);
});