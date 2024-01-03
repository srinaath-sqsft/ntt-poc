package gallivant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.Random;
import java.io.ByteArrayInputStream;
import sun.misc.BASE64Decoder;

import javax.imageio.ImageIO;

public class ImageProcessingUtil {
    private final static Random RANDOM = new Random();
    private static final Logger logger = LoggerFactory.getLogger(AdService.class);


    public static void encodeAdImage(String format) {
        try {
            logger.info("Advert Image not encoded in format compatible with frontend - Encoding Image");
            logger.info("Encode image to format: " + format);

            int sleepDurationMillis = RANDOM.nextInt(10_000) + 2_000;
            Thread.sleep(sleepDurationMillis);
        }
        catch (Exception e){
            logger.error(e.toString());
        }

    }
}





