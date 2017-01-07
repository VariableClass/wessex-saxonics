from google.appengine.api import images

def transform(image_metadata, image):

    if image_metadata.auto:
        image = images.im_feeling_lucky(image)

    if image_metadata.rotatedDegrees:
        image = images.rotate(image, image_metadata.rotatedDegrees)

    if image_metadata.flip_vertical:
        image = images.vertical_flip(image)

    if image_metadata.flip_horizontal:
        image = images.horizontal_flip(image)

    if image_metadata.width and image_metadata.height:
        image = images.resize(image, width=image_metadata.width, height=image_metadata.height)

    elif image_metadata.width:
        image = images.resize(image, width=image_metadata.width)

    elif image_metadata.height:
        image = images.resize(image, height=image_metadata.height)

    return image


def get_metadata(image):

    image = images.Image(image)
    image.rotate(0)
    image.execute_transforms(parse_source_metadata=True)
    image_metadata = image.get_original_metadata()

    return image_metadata
