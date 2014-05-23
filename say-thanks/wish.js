/*AFTER = 1401605999
TOKEN = '[Access Token]'

function get_posts():
    """Returns dictionary of id, first names of people who posted on my wall
    between start and end time"""
    query = ("SELECT post_id, actor_id, message FROM stream WHERE "
            "filter_key = 'others' AND source_id = me() AND "
            "created_time > 1353233754 LIMIT 85")

    payload = {'q': query, 'access_token': TOKEN}
    r = requests.get('https://graph.facebook.com/fql', params=payload)
    result = json.loads(r.text)
    return result['data']

function commentall(wallposts):
    """Comments thank you on all posts"""
    #TODO convert to batch request later
    for wallpost in wallposts:
    	if wallpost['post_id'] in done['data']:
            continue

        r = requests.get('https://graph.facebook.com/%s' %
                wallpost['actor_id'])
        url = 'https://graph.facebook.com/%s/comments' % wallpost['post_id']
        user = json.loads(r.text)
        message = 'Thank You %s :)' % user['first_name']
        payload = {'access_token': TOKEN, 'message': message}
        print message
        try:
            s = requests.post(url, data=payload)
            done['data'].append(wallpost['post_id'])
        except:
            json.dump(done,file("done.json","w"))
            exit(1)

        print "Wall post %s done" % wallpost['post_id']
    
commentall(get_posts())
*/
