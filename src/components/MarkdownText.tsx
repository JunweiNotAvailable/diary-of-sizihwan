import { parseMarkdown } from "../utils/Functions";
import { Text } from "react-native";

const MarkdownText = ({ children, style, numberOfLines }: { children: string; style?: any; numberOfLines?: number }) => {
  const parsedText = parseMarkdown(children);

  return (
    <Text style={style} numberOfLines={numberOfLines} ellipsizeMode="tail">
      {parsedText.map((part, index) => (
        <Text key={index} style={part.style}>
          {part.text}
        </Text>
      ))}
    </Text>
  );
};

export default MarkdownText;