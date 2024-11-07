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

export function removeTrailingSlash(url) {
  if (url && url.length > 1 && url.at(-1) === '/') {
    return url.slice(0, -1);
  }
  return url;
}

export function isEqualURLs(url1, url2) {
  return (
    url1 && url2
    && removeTrailingSlash(new URL(url1).pathname) === removeTrailingSlash(new URL(url2).pathname)
  );
}

export function getAdjacentItems(path, arr) {
  // Find the index of the item with the given path
  const index = arr.findIndex((item) => item.path === path);

  // If the item was not found, return null
  if (index === -1) {
    return null;
  }

  // Calculate the indices of the previous and next items
  const prevIndex = (index - 1 + arr.length) % arr.length;
  const nextIndex = (index + 1) % arr.length;

  // Return the previous and next items
  return { prev: arr[prevIndex], next: arr[nextIndex] };
}

export const delay = (delayInms) => new Promise((resolve) => setTimeout(resolve, delayInms));
