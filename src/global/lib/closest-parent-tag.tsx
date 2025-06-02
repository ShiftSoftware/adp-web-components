export default function closestParentTag(node, className): HTMLElement {
  while (node) {
    if (node.classList && node.classList.contains(className)) return node;

    if (node.parentNode) node = node.parentNode;
    else if (node.host) node = node.host;
    else return null;
  }

  return null;
}
