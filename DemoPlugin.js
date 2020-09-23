import { VERSION } from '@twilio/flex-ui';
import { FlexPlugin } from 'flex-plugin';
import reducers, { namespace } from './states';

const PLUGIN_NAME = 'DemoPlugin';

export default class DemoPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param manager { import('@twilio/flex-ui').Manager }
   */
  init(flex, manager) {

    //================================================================================
    // Demo starts here
    //================================================================================

    const getCallerDetails = (phoneNumber) => {
      // Twilio REST endpoint
      const baseUrl = 'https://platinum-otter-1354.twil.io' // *** Change this to your base url ***
      const twilioEndpoint = baseUrl + '/sf-lookup'

      // Get the user's auth token to include in the request body for authentication
      const token = manager.store.getState().flex.session.ssoTokenPayload.token

      // Request body
      const body = {
        Token: token,
        phoneNumber: phoneNumber
      };

      // Set up the HTTP options for your request
      const options = {
        method: 'POST',
        body: new URLSearchParams(body),
        headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        }
      };

      // Make the network request using the Fetch API
      fetch(twilioEndpoint, options)
        .then(resp => resp.json())
        .then(data => console.log(data));

    }

    flex.Actions.addListener("afterAcceptTask", (payload) => getCallerDetails(payload.task.defaultFrom));

    //================================================================================
    // Demo ends here
    //================================================================================

  }

  /**
   * Registers the plugin reducers
   *
   * @param manager { Flex.Manager }
   */
  registerReducers(manager) {
    if (!manager.store.addReducer) {
      // eslint: disable-next-line
      console.error(`You need FlexUI > 1.9.0 to use built-in redux; you are currently on ${VERSION}`);
      return;
    }

    manager.store.addReducer(namespace, reducers);
  }
}
