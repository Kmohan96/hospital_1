import logging

logger = logging.getLogger(__name__)


def send_mock_sms(phone_number, message):
    logger.info('MOCK_SMS to %s: %s', phone_number, message)
    return True
