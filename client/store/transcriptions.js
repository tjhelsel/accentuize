import axios from 'axios';
import { odId, odKey } from '../../secrets';
import { convertToAccent } from '../../utils/convertText';

//ACTION TYPES
const GOT_WORD_PRON = 'GOT_WORD_PRON';
const GOT_PHRASE_PRON = 'GOT_PHRASE_PRON';
const REMOVED_WORD = 'REMOVED_WORD';

//INITIAL STATE

const initialState = [];

//ACTION CREATORS

const gotWordPron = word => ({
  type: GOT_WORD_PRON,
  word
});

const gotPhrasePron = phrase => ({
  type: GOT_PHRASE_PRON,
  phrase
});

const removedWord = word => ({
  type: REMOVED_WORD,
  word
});

const axiosConfig = {
  headers: {
    Accept: 'application/json',
    app_id: odId,
    app_key: odKey
  }
};

export const getPron = (word, accent) => {
  const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
  return async dispatch => {
    try {
      const { data } = await axios.get(
        proxyUrl +
          `https://od-api.oxforddictionaries.com/api/v2/entries/en-us/${word}?fields=pronunciations&strictMatch=false`,
        axiosConfig
      );
      const dictPron =
        data.results[0].lexicalEntries[0].pronunciations[1].phoneticSpelling;
      const accentedPron = convertToAccent(accent, dictPron);
      dispatch(gotWordPron({ word, dictPron, accent, accentedPron }));
    } catch (error) {
      console.error(error);
    }
  };
};

export const getPhrasePron = (phrase, accent) => {
  const words = phrase.split(' ');
  const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
  return async dispatch => {
    try {
      const transcribedWords = await words.reduce(async (acc, word) => {
        const { data } = await axios.get(
          proxyUrl +
            `https://od-api.oxforddictionaries.com/api/v2/entries/en-us/${word}?fields=pronunciations&strictMatch=false`,
          axiosConfig
        );
        const dictPron =
          data.results[0].lexicalEntries[0].pronunciations[1].phoneticSpelling;
        return acc + ' ' + dictPron;
      }, '');
      console.log('words after loop: ', transcribedWords);
      const accentedPron = convertToAccent(accent, transcribedWords);
      dispatch(gotWordPron({ phrase, transcribedWords, accent, accentedPron }));
    } catch (error) {
      console.error(error);
    }
  };
};

//REDUCER

export default (state = initialState, action) => {
  switch (action.type) {
    case GOT_WORD_PRON:
      console.log(action.word);
      return [...state, action.word];
    case GOT_PHRASE_PRON:
      return [...state, ...action.phrase];
    case REMOVED_WORD:
      return [...state].filter(entry => {
        return entry.name !== action.word.name && entry.ipa !== action.word.ipa;
      });
    default:
      return state;
  }
};
