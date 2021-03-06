"use strict";

/* eslint-disable */

const Fs = require("fs");
const Yaml = require("js-yaml");
const Path = require("path");
const _ = require("lodash");
const xsh = require("xsh");
const expect = require("chai").expect;
const Fyn = require("../../lib/fyn");
const PkgSrcManager = require("../../lib/pkg-src-manager");
const mockNpm = require("../fixtures/mock-npm");

describe("pkg-src-manager", function() {
  let fynCacheDir;

  let server;
  before(() => {
    return mockNpm().then(s => (server = s));
  });

  after(done => {
    server.stop(done);
  });

  beforeEach(() => {
    fynCacheDir = Path.join(__dirname, `../.tmp_${Date.now()}`);
  });

  afterEach(() => {
    xsh.$.rm("-rf", fynCacheDir);
  });

  it("should save meta cache with etag", () => {
    const host = `localhost:${server.info.port}`;
    const mgr = new PkgSrcManager({
      registry: `http://${host}`,
      fynCacheDir,
      fyn: {}
    });
    return mgr
      .fetchMeta({
        name: "mod-a",
        semver: ""
      })
      .then(meta => {
        expect(meta.fynFo[host].etag).to.exist;
      });
  });

  it("should handle 304 when fetching meta that's already in local cache", () => {
    const host = `localhost:${server.info.port}`;
    const options = {
      registry: `http://${host}`,
      fynCacheDir,
      fyn: {}
    };
    let etag;
    let mgr = new PkgSrcManager(options);
    return mgr
      .fetchMeta({
        name: "mod-a",
        semver: ""
      })
      .then(meta => {
        expect(meta.fynFo[host].etag).to.exist;
        etag = meta.fynFo[host].etag;
        return new PkgSrcManager(options).fetchMeta({
          name: "mod-a",
          semver: ""
        });
      })
      .then(meta => {
        expect(meta.fynFo[host].etag).to.exist;
        expect(meta.fynFo[host].etag).to.equal(etag);
      });
  });
});
