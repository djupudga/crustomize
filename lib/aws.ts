import { spawnSync } from "child_process"

interface CloudFormationOutput {
	OutputKey: string
	OutputValue: string
}

/**
 * Synchronously fetches Outputs from a CloudFormation stack using the AWS CLI.
 *
 * @param stackName - The name of the CloudFormation stack.
 * @param profile - The AWS CLI profile to use.
 * @returns An array of CloudFormation outputs.
 * @throws If the command fails or if the JSON output cannot be parsed.
 */
function fetchOutputs(stackName: string, profile: string): CloudFormationOutput[] {
	// Construct the AWS CLI command arguments
	const args = [
		"cloudformation",
		"describe-stacks",
		"--profile",
		profile,
		"--stack-name",
		stackName,
		"--query",
		"Stacks[0].Outputs",
		"--output",
		"json",
	]

	// Execute the command synchronously
	const result = spawnSync("aws", args, { encoding: "utf-8" })

	if (result.error) {
		throw result.error
	}

	if (result.status !== 0) {
		throw new Error(`Command failed: ${result.stderr}`)
	}

	try {
		// Parse the JSON output from the AWS CLI
		const outputs: CloudFormationOutput[] = JSON.parse(result.stdout)
		return outputs
	} catch (err) {
		throw new Error(`Failed to parse JSON output: ${err}`)
	}
}

/**
 * Synchronously looks up an Output from a CloudFormation stack by key.
 *
 * @param stackName - The name of the CloudFormation stack.
 * @param key - The output key to look for.
 * @returns The output value if found; otherwise, null.
 */
export function lookup(stackName: string, key: string, profile: string): string {
	const outputs = fetchOutputs(stackName, profile)
	const output = outputs.find((o) => o.OutputKey === key)
	if (!output?.OutputValue) {
		throw new Error(
			`Output not found for stack: "${stackName}" and key: "${key}"`,
		)
	}
	return output.OutputValue
}
