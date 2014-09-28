/*jslint indent:2, node:true, nomen:true */
/*globals describe, it, beforeEach, afterEach */
"use strict";

var SeriesStore = require("../");
var assert = require("assert");
var store;

describe("creating SeriesStore()", function () {
  it("creating new store", function (done) {
    store = new SeriesStore();
    assert.ok(store);
    done();
  });
});


describe("addEpisode()", function () {
  it("adding basic episode", function (done) {
    var episode = {SeriesName: "TestSeries", season: 2, episode: 3};
    store.once('addedEpisode', function (eventEpisode) {
      assert.strictEqual(eventEpisode.season, episode.season);
      assert.strictEqual(eventEpisode.episode, episode.episode);
      assert.strictEqual(eventEpisode.lastEpisode, episode.episode);
      done();
    });
    store.addEpisode(episode, function (err) {
      assert.ifError(err);
    });
  });

  it("adding basic episode again", function (done) {
    var episode = {SeriesName: "TestSeries", season: 2, episode: 3},
      cb = function () {
        assert.fail("if the episode isnt added the add event shouldnt fire");
      };
    store.on('addedEpisode', cb);
    store.addEpisode(episode, function (err) {
      assert.ifError(!err);
      store.removeListener('addedEpisode', cb);
      done();
    });
  });

  it("adding episode of another series", function (done) {
    var episode = {SeriesName: "TS", season: 4, episode: 2};
    store.once('addedEpisode', function (eventEpisode) {
      assert.strictEqual(eventEpisode.season, episode.season);
      assert.strictEqual(eventEpisode.episode, episode.episode);
      assert.strictEqual(eventEpisode.lastEpisode, episode.episode);
      done();
    });
    store.addEpisode(episode, function (err) {
      assert.ifError(err);
    });
  });

  it("adding basic multi-episode", function (done) {
    var episode = {SeriesName: "TestSeries", season: 2, episode: 4, lastEpisode: 5};
    store.once('addedEpisode', function (eventEpisode) {
      assert.strictEqual(eventEpisode.season, episode.season);
      assert.strictEqual(eventEpisode.episode, episode.episode);
      assert.strictEqual(eventEpisode.lastEpisode, episode.lastEpisode);
      done();
    });
    store.addEpisode(episode, function (err) {
      assert.ifError(err);
    });
  });

  it("adding episode that clashes with end of multi-episode", function (done) {
    var episode = {SeriesName: "TestSeries", season: 2, episode: 5};
    store.addEpisode(episode, function (err) {
      assert.ifError(!err);
      done();
    });
  });
});

describe("getEpisode()", function () {
  it("getting basic episode", function (done) {
    var episode = {SeriesName: "TestSeries", season: 2, episode: 3};
    assert.strictEqual(store.getEpisode(episode)[0].SeriesName, "TestSeries");
    assert.strictEqual(store.getEpisode(episode).length, 1);
    done();
  });
  it("getting non existant episode", function (done) {
    var episode = {SeriesName: "TestSeries", season: 4, episode: 2};
    assert.strictEqual(store.getEpisode(episode).length, 0);
    done();
  });
  it("getting multi-episode", function (done) {
    var episode = {SeriesName: "TestSeries", season: 2, episode: 4, lastEpisode: 5};
    assert.strictEqual(store.getEpisode(episode).length, 1);
    done();
  });
  it("getting multiple episodes", function (done) {
    var episode = {SeriesName: "TestSeries", season: 2, episode: 3, lastEpisode: 5};
    assert.strictEqual(store.getEpisode(episode).length, 2);
    done();
  });
});


describe("Series Merge()", function () {
  it("merging TS with TestSeries by renaming TS to TestSeries", function (done) {
    var series = store.getSeriesFromSeriesName("TS"),
      episode = {SeriesName: "TestSeries", season: 2, episode: 3};
    series.SeriesName = "TestSeries";
    assert.strictEqual(store.getEpisode(episode).length, 1);
    episode = {SeriesName: "TestSeries", season: 4, episode: 2};
    assert.strictEqual(store.getEpisode(episode).length, 1);
    done();
  });
});
