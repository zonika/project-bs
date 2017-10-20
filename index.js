require('dotenv').config();

const fetch = require('node-fetch'),
  _ = require('lodash'),
  rita = require('rita'),
  Twit = require('twit'),
  config = {
    twitter: {
      consumer_key: process.env.CONSUMER_KEY,
      consumer_secret: process.env.CONSUMER_SECRET,
      access_token: process.env.ACCESS_TOKEN,
      access_token_secret: process.env.ACCESS_TOKEN_SECRET
    }
  };
  T = new Twit(config.twitter);

function getViceHeadlines() {
  const proms = _.map([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20], (i) => { // roast me
    return fetch(`https://www.vice.com/api/v1/articles?per_page=25&locale=en_us${i === 1 ? '' : `&page=${i}`}`)
      .then(r => r.json())
      .then(headlines => _.join(_.map(_.filter(headlines, (he) => he.title.indexOf("Today's Comic by") === -1), (h) => h.title), '. '));
  });

  return Promise.all(proms).then(p => _.join(p, '. '));
}

function getHeadlines() {
  return fetch('https://api.parsely.com/v2/shares/posts?apikey=vogue.com&pub_days=15&limit=500')
    .then(r => r.json())
    .then((vogueResponse) => {
      const vogueHeadlines = _.join(_.map(vogueResponse.data, (h) => h.title), '. ');
      return getViceHeadlines()
        .then(viceResponse => {
            const fullString = `${vogueHeadlines}. ${viceResponse}`,
            rm = rita.RiMarkov(2);

          rm.loadText(fullString);

          return rm.generateSentences(1);
        });
    });
}

getHeadlines().then((sentence) => {
  const status = sentence[0].slice(0, -1); // get rid of the period

  T.post('statuses/update', { status, weighted_character_count:true }, function(err, data, response) {
    if (err){
      console.log('Error!');
      console.log(err);
    }
    else{
      console.log(data.text);
    }
  });
});
