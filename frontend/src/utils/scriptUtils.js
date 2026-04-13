/**
 * 剧本解析工具函数
 */

/**
 * 解析剧本文本，返回集数和场景结构
 * @param {string} script - 剧本文本
 * @returns {{ episodes: Array, totalScenes: number }}
 */
export const parseScript = (script) => {
  if (!script) return { episodes: [], totalScenes: 0 };

  const episodeRegex = /(第[一二三四五六七八九十百千]+集|第\d+集|Episode\s*\d+|集\s*\d+)[：:\s]*\n?/gi;
  const sceneRegex = /(场景[一二三四五六七八九十百千]+|第[一二三四五六七八九十百千]+场|场景\s*\d+|第\d+场)[：:\s-]*/gi;

  const episodes = [];
  let currentEpisode = null;
  let episodeCounter = 0;

  const episodeParts = script.split(episodeRegex);

  if (episodeParts.length <= 1) {
    const scenes = [];
    const sceneParts = script.split(sceneRegex);

    sceneParts.forEach((part, index) => {
      if (part.match(sceneRegex)) {
        scenes.push({
          id: index,
          title: part.trim(),
          content: sceneParts[index + 1] ? sceneParts[index + 1].trim() : ''
        });
      }
    });

    if (scenes.length === 0 && script.trim()) {
      scenes.push({ id: 0, title: '完整剧本', content: script.trim() });
    }

    return {
      episodes: [{ id: 0, title: '第1集', scenes, sceneRange: `第1-${scenes.length}场` }],
      totalScenes: scenes.length
    };
  }

  episodeParts.forEach((part, index) => {
    if (part.match(episodeRegex)) {
      episodeCounter++;
      currentEpisode = {
        id: episodeCounter - 1,
        title: part.trim(),
        scenes: [],
        sceneRange: ''
      };

      const sceneContent = episodeParts[index + 1] || '';
      const sceneParts = sceneContent.split(sceneRegex);
      let sceneCounter = 0;

      sceneParts.forEach((scenePart, sceneIndex) => {
        if (scenePart.match(sceneRegex)) {
          sceneCounter++;
          currentEpisode.scenes.push({
            id: `${episodeCounter - 1}-${sceneCounter - 1}`,
            title: scenePart.trim(),
            content: sceneParts[sceneIndex + 1] ? sceneParts[sceneIndex + 1].trim().split(/\n{2,}/)[0] : ''
          });
        }
      });

      if (currentEpisode.scenes.length > 0) {
        currentEpisode.sceneRange = `第1-${currentEpisode.scenes.length}场`;
      }

      episodes.push(currentEpisode);
    }
  });

  const totalScenes = episodes.reduce((sum, ep) => sum + ep.scenes.length, 0);

  return { episodes, totalScenes };
};
