import nullthrows from "nullthrows"

const BIGINT_ZERO = 0n
const BIGINT_ONE = 1n
let numberToBigInt = (v: number): bigint => globalThis.BigInt(v)

let bitUnion = (a: bigint, b: bigint): bigint => a | b

export class BitSet<T> {
  _value: bigint
  _lookup: Map<T, bigint>
  _items: Array<T>

  constructor({
    initial,
    items,
    lookup
  }: {
    items: Array<T>
    lookup: Map<T, bigint>
    initial?: BitSet<T> | bigint
  }) {
    if (initial instanceof BitSet) {
      this._value = initial._value
    } else if (initial) {
      this._value = initial
    } else {
      this._value = BIGINT_ZERO
    }

    this._items = items
    this._lookup = lookup
  }

  static from<TT>(items: Array<TT>): BitSet<TT> {
    let lookup: Map<TT, bigint> = new Map()
    for (let i = 0; i < items.length; i++) {
      lookup.set(items[i], numberToBigInt(i))
    }

    return new BitSet({ items, lookup })
  }

  static union<TT>(a: BitSet<TT>, b: BitSet<TT>): BitSet<TT> {
    return new BitSet({
      initial: bitUnion(a._value, b._value),
      lookup: a._lookup,
      items: a._items
    })
  }

  private getIndex(item: T) {
    return nullthrows(this._lookup.get(item), "Item is missing from BitSet")
  }

  add(item: T) {
    this._value |= BIGINT_ONE << this.getIndex(item)
  }

  delete(item: T) {
    this._value &= ~(BIGINT_ONE << this.getIndex(item))
  }

  has(item: T): boolean {
    return Boolean(this._value & (BIGINT_ONE << this.getIndex(item)))
  }

  intersect(v: BitSet<T>) {
    this._value = this._value & v._value
  }

  union(v: BitSet<T>) {
    this._value = bitUnion(this._value, v._value)
  }

  clear() {
    this._value = BIGINT_ZERO
  }

  cloneEmpty(): BitSet<T> {
    return new BitSet({
      lookup: this._lookup,
      items: this._items
    })
  }

  clone(): BitSet<T> {
    return new BitSet({
      lookup: this._lookup,
      items: this._items,
      initial: this._value
    })
  }

  values(): Array<T> {
    let values = []
    let tmpValue = this._value
    let i: number

    while (tmpValue > BIGINT_ZERO) {
      i = tmpValue.toString(2).length - 1

      values.push(this._items[i])

      tmpValue &= ~(BIGINT_ONE << numberToBigInt(i))
    }

    return values
  }
}
