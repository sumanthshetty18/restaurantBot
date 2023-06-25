// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');

class RRBOT extends ActivityHandler {
    constructor() {
        super();
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            const replyText = `Echo: ${ context.activity.text }`;
            await context.sendActivity(MessageFactory.text(replyText, replyText));
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

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
}

module.exports.RRBOT = RRBOT;
