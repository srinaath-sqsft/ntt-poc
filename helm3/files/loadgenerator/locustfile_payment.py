import json

from locust import HttpUser, task, constant
from faker import Faker

import random
import logging
from random import randint


def generate_card(type=None):
    """
    Prefill some values based on the card type
    """
    card_types = ["visa", "mastercard", "discover", "amex"]

    def prefill(t):
        # typical number of digits in credit card
        def_length = 16

        """
        Prefill with initial numbers and return it including the total number of digits
        remaining to fill
        """
        if t == card_types[0]:
            return [4], def_length - 1

        elif t == card_types[1]:
            # master card start with 5 and is 16 digits long
            return [5, randint(1, 5)], def_length - 2

        elif t == card_types[3]:
            # master card start with 5 and is 16 digits long
            return [3, 7], def_length - 3

        else:
            # this section probably not even needed here
            return [], def_length

    def finalize(nums):
        """
        Make the current generated list pass the Luhn check by checking and adding
        the last digit appropriately bia calculating the check sum
        """
        check_sum = 0

        # is_even = True if (len(nums) + 1 % 2) == 0 else False

        """
        Reason for this check offset is to figure out whther the final list is going
        to be even or odd which will affect calculating the check_sum.
        This is mainly also to avoid reversing the list back and forth which is specified
        on the Luhn algorithm.
        """
        check_offset = (len(nums) + 1) % 2

        for i, n in enumerate(nums):
            if (i + check_offset) % 2 == 0:
                n_ = n * 2
                check_sum += n_ - 9 if n_ > 9 else n_
            else:
                check_sum += n
        return nums + [10 - (check_sum % 10)]

    # main body
    if type:
        t = type.lower()
    else:
        t = random.choice(card_types)
    if t not in card_types:
        print
        "Unknown type: '%s'" % type
        print
        "Please pick one of these supported types: %s" % card_types
        return
    initial, rem = prefill(t)
    so_far = initial + [randint(1, 9) for x in range(rem - 1)]
    card = "".join(map(str, finalize(so_far)))
    return '-'.join(card[i:i + 4] for i in range(0, len(card), 4))[0:19]


fake = Faker()
email = fake.email()


import time


class QuickstartUser(HttpUser):
    wait_time = constant(1)
    @task
    def hello_world(self):

        body = {
            'amount': int(random.random()*100),
            'credit_card': {
                'credit_card_number': generate_card(type=random.choice(["visa", "mastercard"])),
                #'credit_card_number': generate_card(type=random.choice(["visa", "mastercard", "amex"])),
                'credit_card_expiration_month': fake.credit_card_expire(start="now", end="+10y", date_format="%m"),
                'credit_card_expiration_year': fake.credit_card_expire(start="now", end="+10y", date_format="%Y"),
                'credit_card_cvv': fake.credit_card_security_code()
            }

        }
        logging.info(body)
        response = self.client.post("/default/dec-2020-gartnermq-paymentservice", json=body, headers={"Content-Type": "application/json"},
)
        if not response.ok:
            logging.info(response.json())
            print("Response status code:", response.status_code)
            print("Response content:", response.content)

