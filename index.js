require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const OpenAI = require('openai-api');
const openai = new OpenAI(process.env.OPENAI_API_KEY);

const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });


const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/webhook', (req, res) => {
  const message = req.body.Body;
  const twiml = new twilio.twiml.MessagingResponse();

  processMessage(message)
    .then(response => {
      twiml.message(response);
      res.set('Content-Type', 'text/xml');
      res.send(twiml.toString());
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Erro Interno do Servidor');
    });
});

async function processMessage(message) {
  let response = cache.get(message);

  if (response) {
    console.log(`Resposta recuperada do cache para mensagem: ${message}`);
    return response;
  }

  const prompt = `User: ${message}\nAI:`;
  const completions = await openai.complete({
    engine: 'davinci',
    prompt: prompt,
    maxTokens: 150,
    n: 1,
    stop: '\n',
  });
  response = completions.choices[0].text.trim();

  cache.set(message, response);
  console.log(`Resposta adicionada ao cache para mensagem: ${message}`);

  return response;
}

app.listen(3000, () => {
  console.log('Servidor iniciado na porta 3000');
});
