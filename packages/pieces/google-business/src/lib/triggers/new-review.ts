// get google business profile oauth2 property to authenticate
// define the trigger
// setup webhook as trigger to listen to new reviews
// get the review id from the webhook
// GET https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/reviews/{reviewId}
// get the review from the google business api
import { createTrigger, getAccessTokenOrThrow} from '@activepieces/framework';
import { TriggerStrategy } from '@activepieces/shared';
import { googleBusinessCommon } from '../common';
import { nanoid } from 'nanoid'

export const newReviewTrigger = createTrigger({
    name: 'new_review_trigger',
    displayName: 'New Review',
    description: 'Triggered when a new review is added to the Google My Business profile',
    type: TriggerStrategy.WEBHOOK,
    props: {
        authentication: googleBusinessCommon.authentication,
        account: ,
        location: ,
    },
    sampleData: {
      "name": string,
      "reviewId": string,
      "reviewer": {
        object (Reviewer)
      },
      "starRating": enum (StarRating),
      "comment": string,
      "createTime": string,
      "updateTime": string,
      "reviewReply": {
        object (ReviewReply)
      }
    },
    async onEnable(context) {
      const randomTag = `ap_new_submission_${nanoid()}`;
      await googleBusinessCommon.subscribeWebhook(
            context.propsValue['account']!,
            context.propsValue['location']!,
            randomTag,
            context.webhookUrl,
            getAccessTokenOrThrow(context.propsValue['authentication'])
      );
      await context.store?.put<WebhookInformation>('_new_review_trigger', {
          tag: randomTag,
      });
  },
  async onDisable(context) {
      const response = await context.store?.get<WebhookInformation>(
          '_new_review_trigger'
      );
      if (response !== null && response !== undefined) {
          await googleBusinessCommon.unsubscribeWebhook(
               context.propsValue['account']!,
               context.propsValue['location']!, 
               response.tag,  
               getAccessTokenOrThrow(context.propsValue['authentication'])
          );
      }
  },
  async run(context) {
      const body = context.payload.body as { form_response: unknown };
      return [body.form_response];
  },
});

interface WebhookInformation {
  tag: string;
}
