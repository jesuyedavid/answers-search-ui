/** @module CardComponent */

import Component from '../component';
import { cardTypes } from './consts';

class CardConfig {
  constructor (config = {}) {
    Object.assign(this, config);

    /**
     * The card type to use
     * @type {string}
     */
    this.cardType = config.cardType || 'Standard';

    /**
     * config.data comes from the data-prop attribute passed in
     * from the parent component.
     * @type {Result}
     */
    this.result = config.data || {};

    /**
     * Template mappings is a function specified in the config
     * that returns config based on the data passed into card
     * @type {Function}
     */
    this.templateMappings = config.templateMappings || (() => {});

    /**
     * Either a function that spits out an array of CTA config objects or an array of CTA config objects
     * or api fieldnames
     * @type {Function|Array<Object|string>}
     */
    this.callsToAction = config.callsToAction || [];

    /**
     * An array of cta custom field names, whose custom field data are expected
     * to contain CTA configuration.
     * @type {Array<string>}
     */
    this.callsToActionFields = config.callsToActionFields || [];
  }
}

export default class CardComponent extends Component {
  constructor (config = {}, systemConfig = {}) {
    super(new CardConfig(config), systemConfig);
  }

  setState (data) {
    return super.setState({
      ...data,
      result: this._config.result,
      cardType: cardTypes[this._config.cardType]
    });
  }

  addChild (data, type, opts) {
    return super.addChild(data, type, {
      templateMappings: this._config.templateMappings,
      callsToAction: this._config.callsToAction,
      callsToActionFields: this._config.callsToActionFields,
      ...opts
    });
  }

  static get type () {
    return 'Card';
  }

  /**
   * The template to render
   * @returns {string}
   * @override
   */
  static defaultTemplateName (config) {
    return 'cards/card';
  }

  static areDuplicateNamesAllowed () {
    return true;
  }
}