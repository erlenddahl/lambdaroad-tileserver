var tilestrata = require('tilestrata');
var headers = require('tilestrata-headers');
var postgismvt = require('tilestrata-postgismvt');
var disk = require('tilestrata-disk');
var config = require('./config');

var strata = tilestrata();

/*
	create table linksegments_tile as (SELECT * FROM linkSegments_tile WHERE version = '20200930')
	alter table linkSegments_tile add column geometrywgs84 geometry
	update linksegments_tile SET geometrywgs84 = ST_TRANSFORM(ST_SetSRID(geometry, 25833), 4326);
	CREATE INDEX linksegments_tile_wgs84 ON linksegments_tile USING GIST (geometrywgs84);

	https://github.com/mapbox/postgis-vt-util/blob/master/src/TileBBox.sql
	postgismvt må modifiserast ved å oppgradere pg-dependency til nyaste versjon, og flytte parameter q i ST_AsMvt til starten.
	I tillegg: alle ST_Transform(${lyr.table}.${lyr.geometry} må endrast til ST_Transform(ST_Force2D(${lyr.table}.${lyr.geometry}) for å unngå "lwcollection_construct: mixed dimension geometries: 2/0"
*/

strata.layer('roadnetwork').route('tile.mvt')
  .use(postgismvt({
    lyr: {
		table: 'linksegments_tile',
		geometry: 'geometrywgs84',
		type: 'LINESTRING',
		srid: 4326,
		minZoom: 3,
		maxZoom: 19,
		buffer: 10,
		fields: 'id',
		resolution: 256,
    },
    pgConfig: {
	    ...config.db,
		max: 20,
		idleTimeoutMillis: 30000,
		connectionTimeoutMillis: 2000
	}}));

module.exports = {
	init: function(app){
		app.use(tilestrata.middleware({
			server: strata,
			prefix: "/maps"
		}));
	}
};