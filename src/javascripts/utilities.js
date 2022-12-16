export function removeContentByIdAfter(id, timeout = 1500, callback = () => {}) {
  setTimeout(() => {
    document.getElementById(id).style.display = 'none';
    callback();
  }, timeout);
}

export function transformToUpper(text) {
  return text.toUpperCase();
}

export function stringInject(str, data) {
  if (typeof str === 'string' && (data instanceof Array)) {
    return str.replace(/({\d})/g, (i) => data[i.replace(/{/, '').replace(/}/, '')]);
  } if (typeof str === 'string' && (data instanceof Object)) {
    if (Object.keys(data).length === 0) {
      return str;
    }

    return str.replace(/({([^}]+)})/g, (i) => {
      const prop = i.replace(/{/, '').replace(/}/, '');

      if (!data[prop]) {
        return i;
      }

      return data[prop];
    });
  } if ((typeof str === 'string' && data instanceof Array === false) || (typeof str === 'string' && data instanceof Object === false)) {
    return str;
  }

  return false;
}

export function removeTags(str) {
  if ((str === null) || (str === '')) {
    return false;
  }
  const strValue = str.toString();

  return strValue.replace(/(<([^>]+)>)/ig, '');
}

export function returnWordList(strValue) {
  let str = strValue.replace(/(^\s*)|(\s*$)/gi, ''); // exclude  start and end white-space
  str = str.replace(/[ ]{2,}/gi, ' '); // 2 or more space to 1
  str = str.replace(/\n /, '\n'); // exclude newline with a start spacing
  return str.split(' ');
}

export function getFirstNWords(str, number) {
  return returnWordList(str).splice(0, number);
}
