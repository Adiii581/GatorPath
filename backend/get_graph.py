import osmnx as ox
import pandas as pd

print("Starting to fetch walking network for University of Florida...")

# 1. Gets the graph for the UF walking network
G = ox.graph_from_place("University of Florida", network_type="walk")
print("Graph data fetched and built.")

# 2. Converts the graph nodes and edges into GeoDataFrames (like tables)
gdf_nodes, gdf_edges = ox.graph_to_gdfs(G)

# 3. Formats and saves nodes.csv 
nodes_df = gdf_nodes.reset_index().rename(columns={
    'osmid': 'node_ID',
    'y': 'latitude',
    'x': 'longitude'
})

# Keeps only the specified columns
final_nodes = nodes_df[['node_ID', 'latitude', 'longitude']]

# Saves to CSV
final_nodes.to_csv('nodes.csv', index=False)
print("nodes.csv written successfully.")

# 4. Format and saves edges.csv 
edges_df = gdf_edges.reset_index().rename(columns={
    'u': 'source_node_ID',
    'v': 'destination_node_ID'
})

final_edges = edges_df[['source_node_ID', 'destination_node_ID']]

# Saves to CSV
final_edges.to_csv('edges.csv', index=False)
print("edges.csv written successfully.")

print("All done.")
