export function parseIPO(description) {
    const inputMatch = description.match(/Input[：:](.*?)(?=Process[：:]|Output[：:]|$)/is);
    const processMatch = description.match(/Process[：:](.*?)(?=Input[：:]|Output[：:]|$)/is);
    const outputMatch = description.match(/Output[：:](.*?)(?=Input[：:]|Process[：:]|$)/is);
    return {
        input: inputMatch?.[1]?.trim(),
        process: processMatch?.[1]?.trim(),
        output: outputMatch?.[1]?.trim(),
    };
}
