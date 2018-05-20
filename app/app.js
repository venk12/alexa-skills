'use strict';

// =================================================================================
// App Configuration
// =================================================================================

const {App} = require('jovo-framework');
var Speech = require('ssml-builder');
var async = require('async');
var sqlite3 = require('sqlite3').verbose();
var AmazonSpeech = require('ssml-builder/amazon_speech');

// =================================================================================
// Database Connection Logic
// =================================================================================

let db = new sqlite3.Database('./MuSigmaInfo.db', (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Connected to MuSigmaInfo.db');
  });

// =================================================================================
// Initiating a Jovo App
// =================================================================================

const config = {
    logging: true,
};

const app = new App(config);

// =================================================================================
// App Logic
// =================================================================================

app.setHandler({
    'LAUNCH': function() {
        this.toIntent('HelloWorldIntent');        
    },

    'HelloWorldIntent': function() {        
        let speech = 'Hello! Nice to meet you... Today I want to introduce Mu Sigma to you. Shall we go ahead?'
        let reprompt = 'Please answer with yes or no.';
        this.followUpState('InitialState')
            .ask(speech,reprompt)
    },
    'InitialState': {
        'yesIntent': function() {
            this.ask('Great! Mu Sigma is the next gen problem solving company...We help 140 of the Fortune 500 in building this capability within their organization');
        },

        'noIntent' : function(){
            var _this = this;

            var speech = new AmazonSpeech();
            speech.say('There are only so many times you can say no.')
                    .pause('1s')
                    .whisper('I am not pushing you to say yes...')
            var speechOutput = speech.ssml(true);
            _this.ask(speechOutput)
        },

        'problemIntent': function(){
            let reprompt = 'What is your focus area?'
            let speech = this.speechBuilder()
                                .addText('I understand this is a little vague, but Mu Sigma solves thousands of problems across business functions and industries...')
                                .addBreak('1s')
                                .addText('To get a better sense of what we do, tell me which industry you are a part of...');                    
            this.ask(speech,reprompt)
        },
        
        'problemAreaIntent': function(focusArea){
            var _this = this;
            
            async.waterfall([
                function(callback){
                    let query = "SELECT * FROM Vertical_Capabilities WHERE Vertical='"+focusArea.value+"'"
                    console.log("QUERY : ",query)
                    db.each(query, (err, row) => {
                        if (err) {
                            console.error(err.message);
                        }
                        else {
                        callback(null, row.Work);
                        }
                    });
                },
                function(arg1, callback){

                    let reprompt = "Do you agree that uncertainty is making it difficult make decisions?"
                    let speech = _this.speechBuilder()
                                        .addText("In "+focusArea.value+", some of the problems we have solved are "+arg1+"...")
                                        .addBreak('300ms')
                                        .addText("Now that you have an idea of what we do in your domain, let me give you more information on why Mu Sigma was created...")
                                        .addBreak('500ms')
                                        .addText("In this fast-paced world, we are increasingly experiencing uncertainty and the rate of uncertainity is just increasing exponentially as time progresses, do you agree?")
                    _this.followUpState('LoKState')
                            .ask(speech,reprompt)
                }
            ])
        },
        'Unhandled': function () {
            console.log("COMES HERE TO UNHANDLED")
            var _this = this;            
            async.waterfall([
                function(callback){
                    db.run(`INSERT INTO Exception_Recording values ('state comes here','hello hello','not yet')`, function(err) {
                        if (err) {
                          return console.log(err.message);
                        }
                        console.log("COMES HERE INTO db.run")
                        var speech = new AmazonSpeech();
                        speech.say("Sorry, I could not figure out what you are saying. Although, I have recorded it so that my creators can update me accordingly.")
                                .pause('1s')
                            
                        var speechOutput = speech.ssml(true);
                        _this.toIntent('problemIntent')  
                      });
                }
            ])
        }
    },
    'LoKState':{
        'yesIntent': function() {
            var _this = this;
            let reprompt = "Do you know why children learn faster than adults?"

            let speech = _this.speechBuilder()
                            .addText('So, organizations of tomorrow should not just be knowledge-oriented organizations, they should be learning organizations.')
                            .addBreak('200ms')
                            .addText('A learning organization evolves quickly like a living thing...')
                            .addBreak('150ms')
                            .addText('Do you know why children learn faster than adults?')
            _this.followUpState('XXState')
                    .ask(speech,reprompt);
        },
        'noIntent': function(){
            //Convince him/her to say an yes
        },
        'Unhandled': function () {
            this.emit(':ask', 'I don\'t get it!', 'I don\'t get it!');
        }
    },
    'XXState':{
        'XXIntent': function(){
            var _this = this;
            let reprompt = "";
            let speech = _this.speechBuilder()
                                .addText('Clearly, it is because the cost of experimenting with the world is very low for them.')
                                .addText('They also tend to repeat these experiments over and over without giving up...')
                                .addText('We believe organizations have something to learn from them...')
                                .addBreak('500ms')
                                .addText('However...How do we enable organizations to experiment faster and effectively?')
                                .addBreak('1ms')
                                .addText("That's where Mu Sigma will help you... We do this by virtue of something we called 'Interdisciplinary Perspective'...")
                                .addText("Are you interested to know how that can help you?")
            _this.followUpState('IPState')
                    .ask(speech,reprompt)
                     
        },
        'Unhandled': function () {
            this.emit(':ask', 'I don\'t get it!', 'I don\'t get it!');
        }
    },
    'IPState':{
        'yesIntent': function(){                
            var _this = this;
            let reprompt = "";
            var speech = new AmazonSpeech();
            speech.say('An interdisciplinary perspective is a way of analyzing, harmonizing, and synthesizing the links between multiple disciplines and perspectives...')
                    .pause('1s')    
                    .say('We work with the largest technology companies, we work with the largest')
                    .prosody({rate: '110%'},'retailers, banks, insurance and finance companies....energy companies, we work with pharma giants, manufacturing companies... you name it')
                    .pause('1s')
                    .say('You might think we are solving such diverse set of problems for diverse set of organizations')
                    .say('But in reality, we are just solving one problem for all these people...')
                    .pause('1s')
                    .prosody({pitch: 'low'},'...and the problem is - how to enable this problem-solving')
                    .prosody({rate:'95%'},'capabilty...')
                    .pause('300ms')
                    .say('within these organizations...')
                    .say('We are able to pull this off, thanks to our people, processes and platforms...')
                    .say('Would you like to know more about our platforms?')

            var speechOutput = speech.ssml(true);
            _this.followUpState('PPPState')
                    .ask(speechOutput,reprompt)
        },
        'Unhandled': function () {
            this.emit(':ask', 'I don\'t get it!', 'I don\'t get it!');
        }        
    },
    'PPPState': {
        'yesIntent' : function(){
            var _this = this;
            let reprompt = 'Please choose one of these: problem definition, solution design and Operationalization';
            var speech = new AmazonSpeech();
            speech.say('Our platforms span across three major areas: problem definition, solution design and Operationalization')
                    .pause('500s')
                    .say('Please pick one, so that I can dive deeper..')

            _this.followUpState('PlatformState')
                    .ask(speechOutput,reprompt)
        },
        'noIntent' : function(){            
            var _this = this;
            let reprompt = "";
            var speech = "";
        },
        'Unhandled': function () {
            this.emit(':ask', 'I don\'t get it!', 'I don\'t get it!');
        }
    },
    'PlatformState':{
        'definitionIntent':function(){

        },
        'solutionIntent':function(){

        },
        'operationalizationIntent':function(){

        },
        'Unhandled': function () {
            this.emit(':ask', 'I don\'t get it!', 'I don\'t get it!');
        }
    },
    'BFSIState':{
        'BFSIIntroIntent':function(){
            var _this = this;
            let reprompt = '';
            var speech = new AmazonSpeech();
            speech.say('I remember you saying your focus area is insurance. Would you')
                    .pause('500s')
                    .say('Please pick one, so that I can dive deeper..')

            _this.followUpState('PlatformState')
                    .ask(speechOutput,reprompt)
        }
    }
});

module.exports.app = app;