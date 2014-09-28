/*jslint node:true, indent:2*/
"use strict";

var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');
var WatchJS = require("watchjs");

function SeriesStore() {
  var self = this;
  EventEmitter.call(self);
  if (!(self instanceof SeriesStore)) { return new SeriesStore(); }
  self.series = [];
  self.episodes = [];
}

inherits(SeriesStore, EventEmitter);

SeriesStore.prototype.getEpisode = function (ep) {
  var self = this,
    series = self.getSeriesFromSeriesName(ep.SeriesName);

  if (!ep.lastEpisode) {
    ep.lastEpisode = ep.episode;
  }
  if (series) {
    return self.episodes.filter(function (obj) {
      if (obj.Series !== series) {
        return false;
      }
      if (obj.season !== ep.season) {
        return false;
      }
      return (obj.episode >= ep.episode && obj.episode <= ep.lastEpisode) ||
        (obj.lastEpisode >= ep.episode && obj.lastEpisode <= ep.lastEpisode);
    });
  }

  return [];
};

SeriesStore.prototype.addEpisode = function (ep, cb) {
  var self = this,
    otherEpisodes = self.getEpisode(ep),
    series = self.getSeriesFromSeriesName(ep.SeriesName);
  if (!ep.lastEpisode) {
    ep.lastEpisode = ep.episode;
  }

  if (otherEpisodes && otherEpisodes.length > 0) {
    cb(new Error("clash"));
  } else {
    if (!series) {
      series = {SeriesName: ep.SeriesName};
      self.series.push(series);
      self.emit('addedSeries', series);
      WatchJS.watch(series, "SeriesName", function () {
        self.seriesNameChanged(this);
      });
    }
    Object.defineProperty(ep, "SeriesName", {
      get: function () {return this.Series.SeriesName; },
      set: function (y) { this.Series.SeriesName = y; }
    });
    ep.Series = series;
    self.episodes.push(ep);
    cb();
    self.emit('addedEpisode', ep);
  }
};


SeriesStore.prototype.seriesNameChanged = function (series) {
  var self = this,
    otherSeries = self.series.filter(function (obj) {
      return obj.SeriesName === series.SeriesName;
    });

  if (otherSeries.length !== 2) {
    return;
  }

  if (otherSeries[0] === series) {
    self.mergeSeries(otherSeries[1], series);
  } else {
    self.mergeSeries(otherSeries[0], series);
  }
};

/*
* Recursively merge properties of two objects
* copied from: http://stackoverflow.com/a/383245
*/
function mergeRecursive(obj1, obj2) {
  var p;
  for (p in obj2) {
    if (obj2.hasOwnProperty(p)) {
      try {
        // Property in destination object set; update its value.
        if (obj2[p].constructor === Object) {
          obj1[p] = mergeRecursive(obj1[p], obj2[p]);

        } else {
          obj1[p] = obj2[p];

        }

      } catch (e) {
        // Property in destination object not set; create it and set its value.
        obj1[p] = obj2[p];

      }
    }
  }

  return obj1;
}

SeriesStore.prototype.mergeSeries = function (primary, secoundary) {
  var self = this,
    index = self.series.indexOf(secoundary);
  mergeRecursive(primary, secoundary);
  self.episodes.forEach(function (episode) {
    if (episode.Series === secoundary) {
      episode.Series = primary;
    }
  });
  if (index > -1) {
    self.series.splice(index, 1);
  }
};

SeriesStore.prototype.getSeriesFromSeriesName = function (SeriesName) {
  var self = this,
    series = self.series.filter(function (obj) {
      return obj.SeriesName === SeriesName;
    });

  if (series.length === 1) {
    return series[0];
  }

  if (series.length === 0) {
    return null;
  }
  return null;
  //return error("Shouldnt be more than one of the same show");
};

module.exports =  SeriesStore;
