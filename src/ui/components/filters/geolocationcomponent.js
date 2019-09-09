/** @module GeoLocationComponent */

import Component from '../component';
import DOM from '../../dom/dom';
import Filter from '../../../core/models/filter';
import StorageKeys from '../../../core/storage/storagekeys';

const METERS_PER_MILE = 1609.344;

const DEFAULT_CONFIG = {
  /**
   * The radius, in miles, around the user's location to find results.
   * If location accuracy is low, a larger radius may be used automatically
   * @type {number}
   */
  radius: 50,

  /**
   * The vertical key to use
   * @type {string}
   */
  verticalKey: null,

  /**
   * If true, submits a search when the value is changed
   * @type {boolean}
   */
  searchOnChange: false,

  /**
   * The title to display
   * @type {string}
   */
  title: 'Location',

  /**
   * The label to display
   * @type {string}
   */
  label: 'Location',

  /**
   * The icon url to show in the geo button
   * @type {string}
   */
  geoButtonIcon: '',

  /**
   * The text to show in the geo button
   * @type {string}
   */
  geoButtonText: 'Use My Location',

  /**
   * The text to show when geolocation is enabled
   * @type {string}
   */
  enabledText: 'Current Location',

  /**
   * The text to show when loading the user's location
   * @type {string}
   */
  loadingText: 'Finding Your Location...',

  /**
   * The text to show if the user's location cannot be found
   * @type {string}
   */
  errorText: 'Could Not Find Your Location',

  /**
   * The CSS selector of the toggle button
   * @type {string}
   */
  buttonSelector: '.js-yxt-GeoLocationFilter-button',

  /**
   * The CSS selector of the query input
   * @type {string}
   */
  inputSelector: '.js-yxt-GeoLocationFilter-input'
};

/**
 * Renders a button that when clicked adds a static filter representing the user's location
 * @extends Component
 */
export default class GeoLocationComponent extends Component {
  constructor (config = {}) {
    super({ ...DEFAULT_CONFIG, ...config });

    /**
     * The query string to use for the input box, provided to template for rendering.
     * Optionally provided
     * @type {string}
     */
    this.query = this.core.globalStorage.getState(`${StorageKeys.QUERY}.${this.name}`) || '';
    this.core.globalStorage.on('update', `${StorageKeys.QUERY}.${this.name}`, q => {
      this.query = q;
      this.setState();
    });

    /**
     * The filter string to use for the provided query
     * Optionally provided
     * @type {string}
     */
    this.filter = this.core.globalStorage.getState(`${StorageKeys.FILTER}.${this.name}`) || '';
    this.core.globalStorage.on('update', `${StorageKeys.FILTER}.${this.name}`, f => { this.filter = f; });
  }

  static get type () {
    return 'GeoLocationFilter';
  }

  static defaultTemplateName () {
    return 'controls/geolocation';
  }

  setState (data) {
    let placeholder = '';
    if (this._enabled) {
      placeholder = this._config.enabledText;
    }
    if (data.geoLoading) {
      placeholder = this._config.loadingText;
    }
    if (data.geoError) {
      placeholder = this._config.errorText;
    }
    super.setState({
      ...data,
      title: this._config.title,
      geoEnabled: this._enabled,
      query: this.query,
      labelText: this._config.label,
      enabledText: this._config.enabledText,
      loadingText: this._config.loadingText,
      errorText: this._config.errorText,
      geoButtonIcon: this._config.geoButtonIcon,
      geoValue: this._enabled || data.geoLoading || data.geoError ? '' : this.query,
      geoPlaceholder: placeholder,
      geoButtonText: this._config.geoButtonText
    });
  }

  onMount () {
    if (this._autocomplete) {
      this._autocomplete.remove();
    }

    this._initAutoComplete(this._config.inputSelector);
    DOM.on(this._config.buttonSelector, 'click', () => this._toggleGeoFilter());
  }

  /**
   * A helper method to wire up our auto complete on an input selector
   * @param {string} inputSelector CSS selector to bind our auto complete component to
   * @private
   */
  _initAutoComplete (inputSelector) {
    if (this._autocomplete) {
      this._autocomplete.remove();
    }

    this._autocomplete = this.componentManager.create('AutoComplete', {
      parent: this,
      name: `${this.name}.autocomplete`,
      isFilterSearch: true,
      container: '.js-yxt-GeoLocationFilter-autocomplete',
      originalQuery: this.query,
      originalFilter: this.filter,
      inputEl: inputSelector,
      verticalKey: this._verticalKey,
      onSubmit: (query, filter) => {
        this.query = query;
        this.filter = Filter.fromResponse(filter);
        this._saveDataToStorage(query, this.filter);
        this._enabled = false;
      }
    });
  }

  /**
   * Toggles the static filter representing the user's location
   * @private
   */
  _toggleGeoFilter () {
    if (!navigator.geolocation) {
      this.setState({ geoError: true });
      return;
    }

    if (!this._enabled) {
      this.setState({ geoLoading: true });
      navigator.geolocation.getCurrentPosition(
        position => {
          this._saveDataToStorage('', this._buildFilter(position));
          this._enabled = true;
          this.setState({});
          this.core.persistentStorage.delete(`${StorageKeys.QUERY}.${this.name}`);
          this.core.persistentStorage.delete(`${StorageKeys.FILTER}.${this.name}`);
        },
        () => this.setState({ geoError: true })
      );
    }
  }

  /**
   * Saves the provided filter under this component's name
   * @param {Filter} filter The filter to save
   * @private
   */
  _saveDataToStorage (query, filter) {
    this.core.persistentStorage.set(`${StorageKeys.QUERY}.${this.name}`, query);
    this.core.persistentStorage.set(`${StorageKeys.FILTER}.${this.name}`, filter);
    this.core.setFilter(this.name, filter);

    if (this._config.searchOnChange) {
      const filters = this.core.globalStorage.getAll(StorageKeys.FILTER);
      let totalFilter = filters[0];
      if (filters.length > 1) {
        totalFilter = Filter.and(...filters);
      }
      const searchQuery = this.core.globalStorage.getState(StorageKeys.QUERY) || '';
      const facetFilter = this.core.globalStorage.getAll(StorageKeys.FACET_FILTER)[0];

      this.core.verticalSearch(this._config.verticalKey, {
        input: searchQuery,
        filter: JSON.stringify(totalFilter),
        facetFilter: JSON.stringify(facetFilter)
      });
    }
  }

  /**
   * Given a position, construct a Filter object
   * @param {Postition} position The position
   * @returns {Filter}
   * @private
   */
  _buildFilter (position) {
    const { latitude, longitude, accuracy } = position.coords;
    const radius = Math.max(accuracy, this._config.radius * METERS_PER_MILE);
    return Filter.position(latitude, longitude, radius);
  }
}