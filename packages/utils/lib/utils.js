const utils = () => {
  return 'Hello from utils';
}
const txt = utils();
console.log(txt);

export * from './life-cycles';
export { utils };