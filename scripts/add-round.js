import path from "node:path";
import { intro, text, outro, isCancel, cancel } from "@clack/prompts";
import fs from "fs-extra";

const handleCancel = (value) => {
  if (isCancel(value)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }
};

intro("Setup a new round");

const topic = await text({
  message: "What is a topic?",
});
handleCancel(topic);

const filename = await text({
  message: "What is a name?",
});
handleCancel(filename);

const items = [];
for (;;) {
  const word = await text({
    message: "What is a current word?",
  });
  handleCancel(word);

  if (word === "" || word === "_") {
    break;
  }

  const definition = await text({
    message: "What is a word definition?",
  });
  handleCancel(definition);

  items.push({
    word,
    definition,
  });
}

const data = {
  items,
};
await fs.outputJSON(
  path.join("data", "suite", topic, `${filename}.json`),
  data,
);

outro("Success!");
