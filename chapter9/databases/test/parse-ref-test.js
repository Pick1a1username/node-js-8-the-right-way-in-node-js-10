'use strict';

const fs = require('fs');
const expect = require('chai').expect;
const parseRDF = require('../lib/parse-rdf.js');

const rdf = fs.readFileSync(`${__dirname}/pg132.rdf`);


describe('parseRDF', () => {
    it('should be a function', () => {
        expect(parseRDF).to.be.a('function');
    });

    it('should parse RDF content', () => {
        const book = parseRDF(rdf);
        expect(book).to.be.an('object');
        expect(book).to.have.a.property('id', 132);
        expect(book).to.have.a.property('title', 'The Art of War');
        expect(book).to.have.a.property('authors')
            .that.is.an('array').with.lengthOf(2)
            .and.contains('Sunzi, active 6th century B.C.')
            .and.contains('Giles, Lionel');
        expect(book).to.have.a.property('subjects')
            .that.is.an('array').with.lengthOf(2)
            .and.contains('Military art and science -- Early works to 1800')
            .and.contains('War -- Early works to 1800');
        expect(book).to.have.a.property('lcc')
            // It should be of type string and it should be at least one character long.
            .that.is.an('string').with.lengthOf(1)
            // It should start with an uppercase letter of the English alphabet,
            // but not I, O, W, X, or Y.
            .to.not.match(/[0-9]/)
            .to.not.include(['I', 'O', 'W', 'X', 'Y']);
    });
});