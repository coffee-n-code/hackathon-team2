#!/usr/bin/env python3
""" Data processing for GoodCop-BadCop project.

data fields:
------------
0. incident (primary key)
    - ID
    - date
    - crime address (intersection/neighborhood)
1. youtube video
    - number of views
    - number of upvotes
    - number of downvotes
2. officer name
    - badge number
    - precinct
3. location (city/country)
4. vote (up/down)
6. reports
    - source
    - credibility
7. status
    - charges laid/under investigation by internal affairs/no suspects, etc.
"""
__author__ = "Roddie Reventar"
import json
import urllib.parse as urlp
import urllib.request as urlr
import numpy as np


def api_get(incident=None, youtube=None, officer=None, location=None,
            vote=None, reports=None, status=None):
    """ Returns numpy array from query to goodcopbadcop api """
    baseurl = "goodcopbadcop.co/v1/"
    argdict = {}
    if incident:
        argdict["incident"] = incident
    if youtube:
        argdict["youtube"] = youtube
    if officer:
        argdict["officer"] = officer
    if location:
        argdict["location"] = location
    if vote:
        argdict["vote"] = vote
    if reports:
        argdict["reports"] = reports
    if status:
        argdict["status"] = status
    friendly = urlp.urlencode(argdict)
    fullurl = baseurl + "?" + friendly
    with urlr.urlopen(fullurl) as f:
        data = np.array([json.loads(line) for line in f])
    return data

if __name__ == "__main__":
    print(api_get(officer="mr. mustache"))