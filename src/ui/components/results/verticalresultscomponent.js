/** @module VerticalResultsComponent */

import Component from '../component';

import MapComponent from '../map/mapcomponent';
import StorageKeys from '../../../core/storage/storagekeys';
import SearchStates from '../../../core/storage/searchstates';

class VerticalResultsConfig {
  constructor (config = {}) {
    Object.assign(this, config);

    /**
     * verticalConfigId used for analytics and passed to children
     * @type {string}
     * @private
     */
    this._verticalConfigId = config.verticalConfigId;

    /**
     * isUniversal is set to true if this component is added by the UniversalResultsComponent
     * @type {boolean}
     * @private
     */
    this._isUniversal = config.isUniversal || false;

    const parentOpts = config._parentOpts || {};

    /**
     * Custom render function
     * @type {function}
     */
    this.renderItem = config.renderItem || parentOpts.renderItem;

    /**
     * Custom item template
     * @type {string}
     */
    this.itemTemplate = config.itemTemplate || parentOpts.itemTemplate;

    /**
     * The url to the universal page for the no results page to link back to with current query
     * @type {string|null}
     */
    this._universalUrl = config.universalUrl;
  }
}

export default class VerticalResultsComponent extends Component {
  constructor (config = {}, systemConfig = {}) {
    super(config, systemConfig);
    this._config = new VerticalResultsConfig(this._config);
    this.moduleId = StorageKeys.VERTICAL_RESULTS;
  }

  mount () {
    if (Object.keys(this.getState()).length > 0) {
      super.mount();
    }

    return this;
  }

  static get duplicatesAllowed () {
    return true;
  }

  setState (data, val) {
    const results = data.results || [];
    const searchState = data.searchState || SearchStates.PRE_SEARCH;
    return super.setState(Object.assign({ results: [] }, data, {
      isPreSearch: searchState === SearchStates.PRE_SEARCH,
      isSearchLoading: searchState === SearchStates.SEARCH_LOADING,
      isSearchComplete: searchState === SearchStates.SEARCH_COMPLETE,
      includeMap: this._config.includeMap,
      mapConfig: this._config.mapConfig,
      eventOptions: this.eventOptions(),
      universalUrl: this._config._universalUrl ? this._config._universalUrl + window.location.search : '',
      showNoResults: results.length === 0,
      query: this.core.globalStorage.getState(StorageKeys.QUERY)
    }), val);
  }

  /**
   * helper to construct the eventOptions object for the view all link
   * @returns {string}
   */
  eventOptions () {
    return JSON.stringify({
      verticalConfigId: this._config._verticalConfigId
    });
  }

  static get type () {
    return 'VerticalResults';
  }

  /**
   * The template to render
   * @returns {string}
   * @override
   */
  static defaultTemplateName (config) {
    return 'results/verticalresults';
  }

  addChild (data, type, opts) {
    if (type === MapComponent.type) {
      data = {
        map: data
      };
      const newOpts = Object.assign({}, this._config.mapConfig, opts);
      return super.addChild(data, type, newOpts);
    }

    // Apply the proper item renders to the the components
    // have just been constructed. Prioritize global over individual items.
    let comp = super.addChild(data, type, Object.assign(opts, {
      verticalConfigId: this._config._verticalConfigId,
      isUniversal: this._config._isUniversal
    }));

    if (typeof this._config.renderItem === 'function') {
      comp.setRender(this._config.renderItem);
    }
    if (typeof this._config.itemTemplate === 'string') {
      comp.setTemplate(this._config.itemTemplate);
    }
    return comp;
  }
}