import axios from 'axios';
import utils from './utils';

export default class OpenWeatherApi {
  constructor(unit, apiKey, lang) {
    this.unit = unit;
    this.apiKey = apiKey;
    this.baseApiUrl = '//api.openweathermap.org/data/2.5';
    this.lang = lang;
  }
  getForecast(args) {
    const endpointForecast = this.baseApiUrl + '/forecast';
    const endPointOneCall = this.baseApiUrl + '/onecall';
    const params = Object.assign(
      {
        appid: this.apiKey,
        lang: this.lang,
        units: this.unit
      },
      args
    );

    const promise = axios
      .all([
        axios.get(endpointForecast, { params }),
        axios.get(endPointOneCall, { params })
      ])
      .then(
        axios.spread((forecastReponse, oneCallResponse) => {
          const forecastData = forecastReponse.data;
          const oneCallData = oneCallResponse.data;
          if (forecastData && oneCallData) {
            return this._map(forecastData, oneCallData, params.lang);
          }
          return {};
        })
      );
    return promise;
  }
  _map(forecastData, oneCallData, lang) {

    const mapped = {};

    mapped.location = forecastData.city;
    mapped.current = {
      description: oneCallData.current.weather[0].description,
      icon: oneCallData.current.weather[0].icon,
      temperature: {
        min: oneCallData.daily[0].temp.min.toFixed(0),
        max: oneCallData.daily[0].temp.max.toFixed(0),
        current: oneCallData.current.temp.toFixed(0)
      },
      wind: oneCallData.current.wind_speed.toFixed(1),
      humidity: oneCallData.current.humidity,
      date: utils.formatDate(oneCallData.current.dt, lang)
    };
    mapped.days = this._mapForecast(oneCallData.daily, lang);

    return mapped;
  }
  _mapForecast(daysData, lang) {

    var comingDays = utils.getNextDays(new Date());
    var daysMapped = [];

    // Getting data from each day
    for (var i=1; i<5; i++) {

      //var dayDataFiltered = daysData.filter(item => item.dt_txt.includes(comingDays[i]));  //7 or 8 data objects represnting a day
      var dayMapped = {};

      dayMapped.date = utils.formatDate(daysData[i].dt, lang);  // Getting the date from the 1st data object (random)

      dayMapped.temperature = {};
      dayMapped.temperature.min = daysData[i].temp.min.toFixed(0);
      dayMapped.temperature.max = daysData[i].temp.max.toFixed(0);
      
      // Taking the middle of the day as reference
      dayMapped.description = daysData[i].weather[0].description;
      dayMapped.icon = daysData[i].weather[0].icon;
      dayMapped.uvi = daysData[i].uvi;
      dayMapped.wind = daysData[i].wind_speed.toFixed(0);

      daysMapped.push(dayMapped);
    }

    return daysMapped;

  }
}
