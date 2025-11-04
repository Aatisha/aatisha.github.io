// Video Controls Utility - Helper functions
function updatePlayIcon(playBtn, isPaused) {
  if (isPaused) {
    playBtn.classList.add('is-paused');
    playBtn.classList.remove('is-playing');
  } else {
    playBtn.classList.add('is-playing');
    playBtn.classList.remove('is-paused');
  }
}

function updateMuteIcon(muteBtn, isMuted) {
  if (isMuted) {
    muteBtn.classList.add('is-muted');
    muteBtn.classList.remove('is-unmuted');
  } else {
    muteBtn.classList.add('is-unmuted');
    muteBtn.classList.remove('is-muted');
  }
}

// Video Controls Utility
export function initVideoControls() {
  try {
    const videoWrappers = document.querySelectorAll('.video-wrapper');

    // If no video wrappers found, exit silently
    if (!videoWrappers || videoWrappers.length === 0) {
      return;
    }

    videoWrappers.forEach((wrapper) => {
      try {
        const video = wrapper?.querySelector('video');
        const playBtn = wrapper?.querySelector('.play-toggle');
        const muteBtn = wrapper?.querySelector('.mute-toggle');

        // Play/Pause toggle
        if (video && playBtn) {
          // Try autoplay
          video.play().catch(() => {
            /* ignore autoplay restriction */
          });

          // Initialize icon states based on video state
          updatePlayIcon(playBtn, video.paused);

          // Play/Pause toggle
          playBtn.addEventListener('click', () => {
            try {
              if (video.paused) {
                video.play();
              } else {
                video.pause();
              }
              updatePlayIcon(playBtn, video.paused);
            } catch (error) {
              // eslint-disable-next-line no-console
              console.warn('Error toggling video playback:', error);
            }
          });

          // Update icon when video state changes
          video.addEventListener('play', () => {
            try {
              updatePlayIcon(playBtn, false);
            } catch (error) {
              // eslint-disable-next-line no-console
              console.warn('Error updating play icon:', error);
            }
          });
          video.addEventListener('pause', () => {
            try {
              updatePlayIcon(playBtn, true);
            } catch (error) {
              // eslint-disable-next-line no-console
              console.warn('Error updating pause icon:', error);
            }
          });
        }

        // Mute/Unmute toggle
        if (video && muteBtn) {
          // Initialize mute icon state
          updateMuteIcon(muteBtn, video.muted);

          muteBtn.addEventListener('click', () => {
            try {
              video.muted = !video.muted;
              if (!video.muted) {
                video.volume = 0.08; // Set volume low on unmute
              }
              updateMuteIcon(muteBtn, video.muted);
            } catch (error) {
              // eslint-disable-next-line no-console
              console.warn('Error toggling video mute:', error);
            }
          });

          // Update icon when mute state changes
          video.addEventListener('volumechange', () => {
            try {
              updateMuteIcon(muteBtn, video.muted);
            } catch (error) {
              // eslint-disable-next-line no-console
              console.warn('Error updating mute icon:', error);
            }
          });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Error initializing video controls for wrapper:', error);
      }
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Error initializing video controls:', error);
  }
}

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
