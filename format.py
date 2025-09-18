import os
import re
import argparse


def insert_images_to_markdown(markdown_file_path, assets_dir, output_file_path):
    # Read the Markdown file
    with open(markdown_file_path, 'r', encoding='utf-8') as f:
        content = f.readlines()

    # Prepare new content
    new_content = []
    header_pattern = re.compile(r'^(### |#### )(.+)$')

    # Iterate through each line
    i = 0
    while i < len(content):
        line = content[i]
        # Check if it is a level 3 or level 4 header
        match = header_pattern.match(line)
        if match:
            title = match.group(2).strip()
            # Replace spaces with underscores
            image_name = title.replace(" ", "_")

            new_content.append(line)  # Add the header

            # Add subsequent empty lines
            while i + 1 < len(content) and content[i + 1].strip() == "":
                new_content.append("")  # Add empty line
                i += 1  # Skip empty lines

            # Ensure the description line exists
            if i + 1 < len(content):
                new_content.append(content[i + 1])  # Add description line
                image_found = False

                # Search for the corresponding image
                for ext in ['gif', 'png', 'jpg']:
                    image_path = os.path.join(
                        assets_dir, f"{image_name}.{ext}")
                    if os.path.exists(image_path):
                        # Insert an empty line before the image
                        new_content.append("")
                        markdown_image = f"\n![{title}]({f'/IoM/assets/{image_name}.{ext}'})\n"
                        new_content.append(markdown_image)  # Insert the image
                        image_found = True
                        break

                # Skip the description line
                i += 1

            # If no image was found, continue to the next line
            if not image_found:
                # Insert an empty line to separate sections
                new_content.append("")

        else:
            new_content.append(line)  # If not a header, just add the line

        i += 1  # Process the next line

    # Write to the new Markdown file
    with open(output_file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_content)

    print(
        f"Markdown file has been updated to include images, output to: {output_file_path}")


if __name__ == "__main__":
    # Set up command line argument parser
    parser = argparse.ArgumentParser(
        description='Insert images into Markdown based on headers.')
    parser.add_argument('markdown_file', type=str,
                        help='Path to the Markdown file')
    parser.add_argument('assets_dir', type=str,
                        help='Path to the assets directory')
    parser.add_argument('output_file', type=str,
                        help='Path to the output Markdown file')

    args = parser.parse_args()

    insert_images_to_markdown(
        args.markdown_file, args.assets_dir, args.output_file)
