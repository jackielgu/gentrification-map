import sys
import re

def split(filename):
	lines = open(filename).read().splitlines()
	print(lines)
	return lines

def extract_names(list_of_everything):
	list_of_names = []
	for line in list_of_everything:
		name = line.partition('(')[0]
		list_of_names.append(name)
	
	print(list_of_names)
	return list_of_names

def extract_coordinates(list_of_everything):
	list_of_coordinates = []
	for line in list_of_everything:
		coordinates = line[line.find('(') + 1:line.find(')')]
		list_of_coordinates.append(coordinates)

	print (list_of_coordinates)
	return list_of_coordinates

def flip_coordinates(list_of_coordinates):
	list_of_corrected_coords = []

	for coords_string in list_of_coordinates:
		coords_tuple = coords_string.split(',')
		print(coords_tuple)
		corrected_coords_string = str(coords_tuple[1]) + "," + str(coords_tuple[0])
		list_of_corrected_coords.append(corrected_coords_string)

	print(list_of_corrected_coords)
	return list_of_corrected_coords

def extract_links(list_of_everything):
	list_of_links = []

	for line in list_of_everything:
		link = line.split("\t")[1]
		list_of_links.append(link)

	return list_of_links

def generate_json_file(list_of_names, list_of_coordinates, list_of_links, filename):
	f = open(filename, 'w')
	f.write("{\n\"type\": \"FeatureCollection\",\n\n\"features\": [\n")

	for x in range(0, len(list_of_names)):
		f.write("{ \"type\": \"Feature\", \"link\": \"" + list_of_links[x] + "\", " "\"properties\": { \"Name\": \"" + list_of_names[x] + 
			"\"}, \"geometry\": { \"type\": \"Point\", \"coordinates\": [" + list_of_coordinates[x] + "] } },\n")

	f.write("]\n}")

file_to_parse = sys.argv[1]
list_of_everything = split(file_to_parse)
list_of_names = extract_names(list_of_everything)
list_of_coordinates = extract_coordinates(list_of_everything)
list_of_corrected_coords = flip_coordinates(list_of_coordinates)
list_of_links = extract_links(list_of_everything)

generate_json_file(list_of_names, list_of_corrected_coords, list_of_links, sys.argv[2])

# USAGE: py json_generator.py cafes___.txt cafes____.json