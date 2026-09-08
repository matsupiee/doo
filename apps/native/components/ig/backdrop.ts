/** テキストだけの投稿を、ストーリーのような色面に載せるための配色。 */
const TEXT_BACKDROPS = [
  ["#f9ce34", "#ee2a7b"],
  ["#6228d7", "#ee2a7b"],
  ["#0095f6", "#6228d7"],
  ["#ff7a45", "#ed4956"],
] as const;

/** 同じ投稿にはいつも同じ色が出るように、ID から色を決める。 */
export function backdropFor(id: string): readonly [string, string] {
  let sum = 0;
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i);
  return TEXT_BACKDROPS[sum % TEXT_BACKDROPS.length];
}
