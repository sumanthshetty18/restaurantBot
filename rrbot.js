// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');
const { MakeReservationDialog } = require('./componentDialogs/makeReservationDialog');
const { CancelReservationDialog } = require('./componentDialogs/cancelReservationDialog');

const {LuisRecognizer}  = require('botbuilder-ai');

class RRBOT extends ActivityHandler {
    constructor(conversationState,userState) {
        super();

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialogState = conversationState.createProperty("dialogState");
        this.makeReservationDialog = new MakeReservationDialog(this.conversationState,this.userState); 
        this.cancelReservationDialog = new CancelReservationDialog(this.conversationState,this.userState); 

        this.previousIntent = this.conversationState.createProperty("previousIntent");
        this.conversationData= this.conversationState.createProperty("conversationData");

        const dispatchRecognizer = new LuisRecognizer({
            applicationId: process.env.LuisAppId,
            endpointKey: process.env.LuisAPIKey,
            endpoint: `https://cphsluisv1-authoring.cognitiveservices.azure.com/`
        }, {
            includeAllIntents: true
        }, true);


         
        this.onMessage(async (context, next) => {
            const luisResult = await dispatchRecognizer.recognize(context)
            //console.log(luisResult);
            const intent = LuisRecognizer.topIntent(luisResult); 

            const entities = luisResult.entities;
            //console.log(entities);

            //await this.dispatchToIntentAsync(context,intent);
            await this.dispatchToIntentAsync(context,intent,entities);
             
            await next();
        });

        this.onDialog(async (context,next)=>{
            await this.conversationState.saveChanges(context,false);
            await this.userState.saveChanges(context,false);
            await next();
        })


        this.onMembersAdded(async (context, next) => {
             await this.sendWelcomeMesage(context)
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    async sendWelcomeMesage(turnContext){
        const { activity } = turnContext;

        for(const idx in activity.membersAdded){
            if(activity.membersAdded[idx].id !== activity.recipient.id){
                const welcomeMessage = `Welcome to Restaurant Reservation Bot ${activity.membersAdded[idx].name}.`;
                await turnContext.sendActivity(welcomeMessage);
                await this.sendSuggestedActions(turnContext);
            }
        }
    }

    async sendSuggestedActions(turnContext){
        var reply = MessageFactory.suggestedActions(['Make Reservation','Cancel Reservation','Restaurant Address'],'What do you want to do today?');
        await turnContext.sendActivity(reply);
    }

    async dispatchToIntentAsync(context,intent,entities){

        var currentIntent = '';
        const previousIntent = await this.previousIntent.get(context,{});
        const conversationData=await this.conversationData.get(context,{});

        if(previousIntent.intentName && conversationData.endDialog===false){
            currentIntent= previousIntent.intentName;
        }
        else if(previousIntent.intentName && conversationData.endDialog===true){
            //currentIntent = context.activity.text;
            currentIntent = intent;
        }
        else{
            //currentIntent=context.activity.text;
            currentIntent=intent;
            //await this.previousIntent.set(context,{intentName:context.activity.text});
            await this.previousIntent.set(context,{intentName:intent});
        }

        switch(currentIntent){

            case 'Make_Reservation':
                //console.log("Inside Make reservation case");
                await this.conversationData.set(context,{endDialog:false});
                //await this.makeReservationDialog.run(context,this.dialogState);
                await this.makeReservationDialog.run(context,this.dialogState,entities);
                conversationData.endDialog = await this.makeReservationDialog.isDialogComplete();
                if(conversationData.endDialog){
                    await this.previousIntent.set(context,{intentName:null});
                    await this.sendSuggestedActions(context);
                }
                break;

            case 'Cancel_Reservation':
                //console.log("Inside Cancel reservation case");
                await this.conversationData.set(context,{endDialog:false});
                await this.cancelReservationDialog.run(context,this.dialogState);
                conversationData.endDialog = await this.cancelReservationDialog.isDialogComplete();
                if(conversationData.endDialog){
                    await this.previousIntent.set(context,{intentName:null});
                    await this.sendSuggestedActions(context);
                }
                break;


            default:
                console.log("Did not match Make Reservation case");
                break;
        }
    }
}

module.exports.RRBOT = RRBOT;