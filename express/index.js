const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.urlencoded({extended:false}));
app.post('/tracker', (req, res) => {
    // console.log(`here is body:${req.body}`)
    console.log(req.body)
    res.send('good')
});
app.listen(9000,() => {
    console.log('success 9000')
});