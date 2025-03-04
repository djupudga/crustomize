import { type CollectionTag, Scalar, type ScalarTag, Schema, YAMLMap } from 'yaml'
import { stringifyString, type StringifyContext } from 'yaml/util'

const tags = [
	"!Ref",
	"!Join",
	"!Sub",
]

type ASeq = {
	"!Ref": string
}

class Ref {
	constructor(public value: string) {}
	toString() {
		return "!Ref " + this.value
	}
}

const RefTag: ScalarTag = {
	tag: "!Ref",
	identify: (value: any) => {
		if (value instanceof Ref) {
			return true
		}
		return false
	},
	resolve(value: string): Ref {
		return new Ref(value)
	},
	stringify(i, ctx, onComment, onChompKeep)	{
		const value = i.value as Ref
		return stringifyString({ value }, ctx, onComment, onChompKeep)
	}
}

/**
 * `!bigint` BigInt
 *
 * [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) values,
 * using their conventional `123n` representation.
 */
export const bigint: ScalarTag = {
  identify: (value: any) => {
    return typeof value === 'bigint' || value instanceof BigInt
  },
  tag: '!bigint',
  resolve(str: string) {
    if (str.endsWith('n')) str = str.substring(0, str.length - 1)
    return BigInt(str)
  },
  stringify(item: Scalar, ctx: StringifyContext, onComment, onChompKeep) {
    if (!bigint.identify?.(item.value)) {
      throw new TypeError(`${item.value} is not a bigint`)
    }
    const value = (item.value as BigInt).toString() + 'n'
		console.log('h', value)
    return stringifyString({ value }, ctx, onComment, onChompKeep)
  }
}

export const AwsTags = [
	RefTag, bigint,
]
