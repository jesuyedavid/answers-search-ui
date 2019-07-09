/** @module AutoCompleteApi */

import ApiRequest from '../http/apirequest';
import AutoCompleteDataTransformer from './autocompletedatatransformer';
import { AnswersEndpointError } from '../errors/errors';

/**
 * AutoCompleteApi exposes an interface for network related matters
 * for all the autocomplete endpoints.
 */
export default class AutoCompleteApi {
  constructor (opts = {}) {
    let params = new URL(window.location.toString()).searchParams;
    let isLocal = params.get('local');

    /**
     * The baseUrl to use for making a request
     * @type {string}
     * @private
     */
    this._baseUrl = isLocal ? 'http://' + window.location.hostname : 'https://liveapi.yext.com';

    /**
     * The API Key to use for the request
     * @type {string}
     * @private
     */
    this._apiKey = opts.apiKey || null;

    /**
     * The Answers Key to use for the request
     * @type {string}
     * @private
     */
    this._answersKey = opts.answersKey || null;

    /**
     * The version of the API to make a request to
     * @type {string}
     * @private
     */
    this._version = opts.version || 20190101 || 20190301;
  }

  /**
   * Autocomplete filters
   * @param {string} input The input to use for auto complete
   */
  queryFilter (input, verticalKey, barKey) {
    let request = new ApiRequest({
      baseUrl: this._baseUrl,
      endpoint: '/v2/accounts/me/answers/filtersearch',
      apiKey: this._apiKey,
      version: this._version,
      params: {
        'input': input,
        'answersKey': this._answersKey,
        'experienceKey': verticalKey,
        'inputKey': barKey
      }
    });

    return request.get()
      .then(response => response.json())
      .then(response => AutoCompleteDataTransformer.filter(response.response, barKey))
      .catch(error => {
        throw new AnswersEndpointError('Filter search request failed', 'AutoComplete', error);
      });
  }

  queryVertical (input, verticalKey, barKey) {
    let request = new ApiRequest({
      baseUrl: this._baseUrl,
      endpoint: '/v2/accounts/me/entities/autocomplete',
      apiKey: this._apiKey,
      version: this._version,
      params: {
        'input': input,
        'experienceKey': verticalKey,
        'barKey': barKey
      }
    });

    return request.get()
      .then(response => response.json())
      .then(response => AutoCompleteDataTransformer.vertical(response.response, request._params.barKey))
      .catch(error => {
        throw new AnswersEndpointError('Vertical search request failed', 'AutoComplete', error);
      });
  }

  queryUniversal (queryString) {
    let request = new ApiRequest({
      baseUrl: this._baseUrl,
      endpoint: '/v2/accounts/me/answers/autocomplete',
      apiKey: this._apiKey,
      version: this._version,
      params: {
        'input': queryString,
        'answersKey': this._answersKey
      }
    });

    return request.get(queryString)
      .then(response => response.json())
      .then(response => AutoCompleteDataTransformer.universal(response.response))
      .catch(error => {
        throw new AnswersEndpointError('Universal search request failed', 'AutoComplete', error);
      });
  }
}